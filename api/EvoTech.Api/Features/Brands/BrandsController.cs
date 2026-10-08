using EvoTech.Api.Common;
using EvoTech.Api.Data;
using EvoTech.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace EvoTech.Api.Features.Brands;

[Route("api/v1/brands")]
public class BrandsController(AppDbContext db) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BrandResponse>>> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        var query = db.Brands.AsQueryable();

        if (!includeInactive)
            query = query.Where(b => b.IsActive);

        var brands = await query
            .OrderBy(b => b.Name)
            .Select(b => new BrandResponse(b.Id, b.Name, b.IsActive))
            .ToListAsync(ct);

        return Ok(brands);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<BrandResponse>> GetById(long id, CancellationToken ct)
    {
        var brand = await db.Brands
            .Where(b => b.Id == id)
            .Select(b => new BrandResponse(b.Id, b.Name, b.IsActive))
            .SingleOrDefaultAsync(ct);

        return brand is null
            ? Problem(statusCode: StatusCodes.Status404NotFound,
                      title: "Brand not found",
                      detail: $"No brand with id {id}.")
            : Ok(brand);
    }

    [HttpPost]
    public async Task<ActionResult<BrandResponse>> Create(
        CreateBrandRequest request,
        CancellationToken ct)
    {
        if (await ValidateAsync(request, ct) is { } problem) return problem;

        var exists = await db.Brands.AnyAsync(b => b.Name == request.Name, ct);
        if (exists) return Conflict(request.Name);

        var brand = new Brand { Name = request.Name, IsActive = request.IsActive };
        db.Brands.Add(brand);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            return Conflict(request.Name);
        }

        var response = new BrandResponse(brand.Id, brand.Name, brand.IsActive);

        return CreatedAtAction(nameof(GetById), new { id = brand.Id }, response);
    }

    private ObjectResult Conflict(string name) =>
        Problem(statusCode: StatusCodes.Status409Conflict,
                title: "Brand already exists",
                detail: $"A brand named '{name}' already exists.");
}

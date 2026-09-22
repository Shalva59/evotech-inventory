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
    /// <summary>
    /// Inactive brands are excluded by default: the common caller is the
    /// add-product dropdown. There is no global query filter doing this
    /// silently — it is this Where clause, visible at the point of use.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BrandResponse>>> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        var query = db.Brands.AsQueryable();

        if (!includeInactive)
            query = query.Where(b => b.IsActive);

        // Select() projects straight to the DTO, so EF emits
        // `SELECT id, name, is_active` rather than selecting whole entities
        // and mapping afterwards. Projection also skips the change tracker
        // entirely, which is why no AsNoTracking() is needed here.
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

        // Problem() produces the same RFC 7807 envelope as every other error
        // in this API, rather than a bare 404 with no body.
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

        // Business rule: names are unique. This check exists to produce a good
        // error message — it is NOT what guarantees uniqueness.
        //
        // Case-sensitive on purpose, to match the unique index exactly. A
        // case-insensitive check here would reject 'apple' while the database
        // would happily have accepted it, so the API would be stricter than
        // the schema and the two would disagree.
        var exists = await db.Brands.AnyAsync(b => b.Name == request.Name, ct);
        if (exists) return Conflict(request.Name);

        var brand = new Brand { Name = request.Name };
        db.Brands.Add(brand);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            // 23505 = unique_violation. Reachable even though we checked above:
            // two concurrent requests can both pass the AnyAsync check before
            // either inserts. The database is the only real arbiter, so the
            // check-then-act race has to be caught, not just avoided.
            return Conflict(request.Name);
        }

        var response = new BrandResponse(brand.Id, brand.Name, brand.IsActive);

        // 201 with a Location header pointing at the new resource.
        return CreatedAtAction(nameof(GetById), new { id = brand.Id }, response);
    }

    private ObjectResult Conflict(string name) =>
        Problem(statusCode: StatusCodes.Status409Conflict,
                title: "Brand already exists",
                detail: $"A brand named '{name}' already exists.");
}

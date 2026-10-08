using System.Linq.Expressions;
using EvoTech.Api.Common;
using EvoTech.Api.Data;
using EvoTech.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace EvoTech.Api.Features.Products;

[Route("api/v1/products")]
public class ProductsController(AppDbContext db) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> GetAll(
        [FromQuery] bool includeArchived = false,
        CancellationToken ct = default)
    {
        var query = db.Products.AsQueryable();

        if (!includeArchived)
            query = query.Where(p => !p.IsArchived);

        var products = await query
            .OrderBy(p => p.Name)
            .Select(ToResponse)
            .ToListAsync(ct);

        return Ok(products);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ProductResponse>> GetById(long id, CancellationToken ct)
    {
        var product = await db.Products
            .Where(p => p.Id == id)
            .Select(ToResponse)
            .SingleOrDefaultAsync(ct);

        return product is null ? NotFound(id) : Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create(
        CreateProductRequest request,
        CancellationToken ct)
    {
        if (await ValidateAsync(request, ct) is { } problem) return problem;
        if (await CheckRelationsAsync(request.BrandId, request.CategoryId, ct) is { } relationProblem)
            return relationProblem;

        var product = new Product
        {
            Sku = request.Sku.Trim(),
            Barcode = NormalizeBarcode(request.Barcode),
            Name = request.Name.Trim(),
            BrandId = request.BrandId,
            CategoryId = request.CategoryId,
            CostPrice = request.CostPrice,
            SellPrice = request.SellPrice,
            MinStockThreshold = request.MinStockThreshold
        };

        db.Products.Add(product);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" } pg)
        {
            return DuplicateCode(pg, product.Sku, product.Barcode);
        }

        var response = await db.Products
            .Where(p => p.Id == product.Id)
            .Select(ToResponse)
            .SingleAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, response);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ProductResponse>> Update(
        long id,
        UpdateProductRequest request,
        CancellationToken ct)
    {
        if (await ValidateAsync(request, ct) is { } problem) return problem;

        var product = await db.Products.SingleOrDefaultAsync(p => p.Id == id, ct);
        if (product is null) return NotFound(id);

        if (await CheckRelationsAsync(request.BrandId, request.CategoryId, ct) is { } relationProblem)
            return relationProblem;

        product.Sku = request.Sku.Trim();
        product.Barcode = NormalizeBarcode(request.Barcode);
        product.Name = request.Name.Trim();
        product.BrandId = request.BrandId;
        product.CategoryId = request.CategoryId;
        product.CostPrice = request.CostPrice;
        product.SellPrice = request.SellPrice;
        product.MinStockThreshold = request.MinStockThreshold;
        product.IsArchived = request.IsArchived;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" } pg)
        {
            return DuplicateCode(pg, product.Sku, product.Barcode);
        }

        var response = await db.Products
            .Where(p => p.Id == id)
            .Select(ToResponse)
            .SingleAsync(ct);

        return Ok(response);
    }

    private static readonly Expression<Func<Product, ProductResponse>> ToResponse = p => new ProductResponse(
        p.Id,
        p.Sku,
        p.Barcode,
        p.Name,
        p.BrandId,
        p.Brand.Name,
        p.CategoryId,
        p.Category.Name,
        p.CostPrice,
        p.SellPrice,
        p.MinStockThreshold,
        p.IsArchived,
        p.Movements.Sum(m => (int?)m.Quantity) ?? 0);

    private async Task<ActionResult?> CheckRelationsAsync(long brandId, long categoryId, CancellationToken ct)
    {
        if (!await db.Brands.AnyAsync(b => b.Id == brandId, ct))
            ModelState.AddModelError("BrandId", $"No brand with id {brandId}.");

        if (!await db.Categories.AnyAsync(c => c.Id == categoryId, ct))
            ModelState.AddModelError("CategoryId", $"No category with id {categoryId}.");

        return ModelState.IsValid ? null : ValidationProblem(ModelState);
    }

    private static string? NormalizeBarcode(string? barcode) =>
        string.IsNullOrWhiteSpace(barcode) ? null : barcode.Trim();

    private ObjectResult NotFound(long id) =>
        Problem(statusCode: StatusCodes.Status404NotFound,
                title: "Product not found",
                detail: $"No product with id {id}.");

    private ObjectResult DuplicateCode(PostgresException pg, string sku, string? barcode)
    {
        var detail = pg.ConstraintName switch
        {
            "ix_products_barcode" => $"A product with barcode '{barcode}' already exists.",
            "ix_products_sku" => $"A product with SKU '{sku}' already exists.",
            _ => "A product with these details already exists."
        };

        return Problem(statusCode: StatusCodes.Status409Conflict,
                       title: "Product already exists",
                       detail: detail);
    }
}

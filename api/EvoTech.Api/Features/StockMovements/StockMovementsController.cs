using System.Linq.Expressions;
using EvoTech.Api.Common;
using EvoTech.Api.Data;
using EvoTech.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EvoTech.Api.Features.StockMovements;

[Route("api/v1/stock-movements")]
public class StockMovementsController(AppDbContext db) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StockMovementResponse>>> GetAll(
        [FromQuery] long? productId,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken ct = default)
    {
        var query = db.StockMovements.AsQueryable();

        if (productId is { } pid)
            query = query.Where(m => m.ProductId == pid);

        if (from is { } f) query = query.Where(m => m.OccurredAt >= f);
        if (to is { } t) query = query.Where(m => m.OccurredAt < t);

        var movements = await query
            .OrderByDescending(m => m.OccurredAt)
            .ThenByDescending(m => m.Id)
            .Select(ToResponse)
            .ToListAsync(ct);

        return Ok(movements);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<StockMovementResponse>> GetById(long id, CancellationToken ct)
    {
        var movement = await db.StockMovements
            .Where(m => m.Id == id)
            .Select(ToResponse)
            .SingleOrDefaultAsync(ct);

        return movement is null
            ? Problem(statusCode: StatusCodes.Status404NotFound,
                      title: "Stock movement not found",
                      detail: $"No stock movement with id {id}.")
            : Ok(movement);
    }

    [HttpPost]
    public async Task<ActionResult<StockMovementResponse>> Create(
        CreateStockMovementRequest request,
        CancellationToken ct)
    {
        if (await ValidateAsync(request, ct) is { } problem) return problem;

        var signed = request.Kind switch
        {
            StockMovementKind.Purchase => request.Quantity,
            StockMovementKind.Sale => -request.Quantity,
            StockMovementKind.Adjustment when request.Direction == StockAdjustmentDirection.Decrease
                => -request.Quantity,
            _ => request.Quantity
        };

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var product = await db.Products
            .FromSql($"SELECT * FROM products WHERE id = {request.ProductId} FOR UPDATE")
            .Select(p => new { p.Id, p.Name })
            .SingleOrDefaultAsync(ct);

        if (product is null)
        {
            ModelState.AddModelError(nameof(request.ProductId),
                $"No product with id {request.ProductId}.");
            return ValidationProblem(ModelState);
        }

        if (signed < 0)
        {
            var onHand = await db.StockMovements
                .Where(m => m.ProductId == request.ProductId)
                .SumAsync(m => (int?)m.Quantity, ct) ?? 0;

            if (onHand + signed < 0)
            {
                return Problem(statusCode: StatusCodes.Status409Conflict,
                    title: "Insufficient stock",
                    detail: $"'{product.Name}' has {onHand} in stock; " +
                            $"this movement would take it to {onHand + signed}.");
            }
        }

        var movement = new StockMovement
        {
            ProductId = request.ProductId,
            Quantity = signed,
            Kind = request.Kind,
            OccurredAt = request.OccurredAt ?? DateTimeOffset.UtcNow,
            UnitCost = request.UnitCost,
            Note = request.Note?.Trim()
        };

        db.StockMovements.Add(movement);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        var response = new StockMovementResponse(
            movement.Id,
            movement.ProductId,
            product.Name,
            movement.Quantity,
            movement.Kind,
            movement.OccurredAt,
            movement.CreatedAt,
            movement.UnitCost,
            movement.Note);

        return CreatedAtAction(nameof(GetById), new { id = movement.Id }, response);
    }

    private static readonly Expression<Func<StockMovement, StockMovementResponse>> ToResponse =
        m => new StockMovementResponse(
            m.Id,
            m.ProductId,
            m.Product.Name,
            m.Quantity,
            m.Kind,
            m.OccurredAt,
            m.CreatedAt,
            m.UnitCost,
            m.Note);
}

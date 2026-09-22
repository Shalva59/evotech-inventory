using System.Linq.Expressions;
using EvoTech.Api.Common;
using EvoTech.Api.Data;
using EvoTech.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EvoTech.Api.Features.StockMovements;

/// <summary>
/// The stock ledger. Note what is missing: no PUT, no PATCH, no DELETE.
/// Movements are append-only — a mistake is corrected by recording a
/// compensating Adjustment, never by editing history.
/// </summary>
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

        // Half-open range: from inclusive, to exclusive. Never BETWEEN on
        // timestamps — it silently excludes everything after midnight on the
        // final day.
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

        // Quantity arrives positive; Kind (and Direction, for an adjustment)
        // determines the sign that actually gets stored.
        var signed = request.Kind switch
        {
            StockMovementKind.Purchase => request.Quantity,
            StockMovementKind.Sale => -request.Quantity,
            StockMovementKind.Adjustment when request.Direction == StockAdjustmentDirection.Decrease
                => -request.Quantity,
            _ => request.Quantity
        };

        // ---- Everything below runs in one transaction ----
        // Checking stock and then inserting is a classic race: two concurrent
        // sales both read 5, both decide -3 is fine, and the product lands at
        // -1. A SELECT before an INSERT proves nothing on its own.
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        // FOR UPDATE takes a row lock on the product for the life of the
        // transaction. A second request touching the SAME product blocks here
        // until this one commits, so the two serialize. Movements for other
        // products are unaffected — the lock is per row, not per table.
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
            // Safe to read now: the row lock guarantees nobody else is
            // inserting movements for this product concurrently.
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
            // Default to now when the caller does not say otherwise.
            OccurredAt = request.OccurredAt ?? DateTimeOffset.UtcNow,
            UnitCost = request.UnitCost,
            Note = request.Note?.Trim()
            // CreatedAt is deliberately not set — the database default now()
            // fills it, and ValueGeneratedOnAdd reads it back.
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

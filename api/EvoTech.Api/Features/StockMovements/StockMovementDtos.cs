using EvoTech.Api.Domain;

namespace EvoTech.Api.Features.StockMovements;

public enum StockAdjustmentDirection
{
    Increase,
    Decrease
}

public record StockMovementResponse(
    long Id,
    long ProductId,
    string ProductName,
    int Quantity,
    StockMovementKind Kind,
    DateTimeOffset OccurredAt,
    DateTimeOffset CreatedAt,
    decimal? UnitCost,
    string? Note);

public record CreateStockMovementRequest(
    long ProductId,
    int Quantity,
    StockMovementKind Kind,
    StockAdjustmentDirection? Direction,
    DateTimeOffset? OccurredAt,
    decimal? UnitCost,
    string? Note);

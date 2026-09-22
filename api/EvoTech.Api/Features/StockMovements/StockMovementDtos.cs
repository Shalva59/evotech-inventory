using EvoTech.Api.Domain;

namespace EvoTech.Api.Features.StockMovements;

/// <summary>
/// Which way an Adjustment goes. An API concept only — the domain stores a
/// signed integer and knows nothing about this enum. Purchase and Sale imply
/// their own direction, so this applies to Adjustment alone.
/// </summary>
public enum StockAdjustmentDirection
{
    Increase,
    Decrease
}

/// <summary>
/// Quantity here is SIGNED, as stored: +30 received, −4 sold. The request
/// takes a positive number and the server applies the sign, but the response
/// shows what is actually in the ledger — so a client can sum these and get
/// the same answer the database does.
/// </summary>
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

/// <summary>
/// Quantity must be POSITIVE. The sign comes from Kind: Purchase adds, Sale
/// removes, and Adjustment follows Direction.
///
/// OccurredAt is optional and defaults to now — pass it to backdate a delivery
/// that was recorded late. It may not be in the future.
/// </summary>
public record CreateStockMovementRequest(
    long ProductId,
    int Quantity,
    StockMovementKind Kind,
    StockAdjustmentDirection? Direction,
    DateTimeOffset? OccurredAt,
    decimal? UnitCost,
    string? Note);

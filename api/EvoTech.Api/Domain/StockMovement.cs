namespace EvoTech.Api.Domain;

/// <summary>
/// Append-only stock ledger. Rows are never updated or deleted — a mistake is
/// corrected by writing a compensating Adjustment, so the history stays true.
///
/// Stock on hand for a product is SUM(Quantity) over its movements. There is
/// deliberately no Quantity column on Product.
/// </summary>
public class StockMovement
{
    public long Id { get; set; }

    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    /// <summary>
    /// Signed: +30 received, −1 sold. Never zero — a movement of nothing is
    /// not an event. The non-zero rule is a CHECK constraint in the config.
    /// </summary>
    public int Quantity { get; set; }

    public StockMovementKind Kind { get; set; }

    /// <summary>When the event actually happened in the shop.</summary>
    public DateTimeOffset OccurredAt { get; set; }

    /// <summary>
    /// When the row was written. Differs from OccurredAt when someone records
    /// yesterday's delivery this morning — and that gap is the only way to
    /// explain why a report changed after you thought it was final.
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// What was actually paid per unit on a Purchase, which can differ from
    /// the product's current CostPrice. Null for Sale and Adjustment.
    /// Precision configured in StockMovementConfiguration, not here.
    /// </summary>
    public decimal? UnitCost { get; set; }

    /// <summary>
    /// Mainly for Adjustment — 'stocktake correction', 'dropped and broken'.
    /// An unexplained adjustment is exactly the row you'll want explained.
    /// </summary>
    public string? Note { get; set; }
}

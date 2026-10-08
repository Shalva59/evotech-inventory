namespace EvoTech.Api.Domain;

public class StockMovement
{
    public long Id { get; set; }

    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }

    public StockMovementKind Kind { get; set; }

    public DateTimeOffset OccurredAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public decimal? UnitCost { get; set; }

    public string? Note { get; set; }
}

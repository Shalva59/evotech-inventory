namespace EvoTech.Api.Domain;

public class Product
{
    public long Id { get; set; }

    public required string Sku { get; set; }

    public string? Barcode { get; set; }

    public required string Name { get; set; }

    public long BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public long CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public decimal CostPrice { get; set; }
    public decimal SellPrice { get; set; }

    public int MinStockThreshold { get; set; }

    public bool IsArchived { get; set; }

    public ICollection<StockMovement> Movements { get; set; } = [];
}

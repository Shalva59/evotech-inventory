namespace EvoTech.Api.Domain;

public class Product
{
    public long Id { get; set; }

    /// <summary>Internal code. Always present — we assign it ourselves.</summary>
    public required string Sku { get; set; }

    /// <summary>
    /// Manufacturer barcode. Nullable: loose parts and consumables often have
    /// none. Gets a unique index, and Postgres permits many NULLs in one.
    /// </summary>
    public string? Barcode { get; set; }

    public required string Name { get; set; }

    public long BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public long CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    /// <summary>Precision is configured in ProductConfiguration, not here.</summary>
    public decimal CostPrice { get; set; }
    public decimal SellPrice { get; set; }

    /// <summary>Low-stock threshold for the dashboard. Compared against the
    /// derived quantity (inbound − outbound), which is never stored.</summary>
    public int MinStockThreshold { get; set; }

    /// <summary>Products are never hard-deleted once movements or sales
    /// reference them. This is how one leaves the catalogue.</summary>
    public bool IsArchived { get; set; }
}

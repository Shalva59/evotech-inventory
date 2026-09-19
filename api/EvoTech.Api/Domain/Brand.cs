namespace EvoTech.Api.Domain;

public class Brand
{
    public long Id { get; set; }
    public required string Name { get; set; }

    /// <summary>
    /// Brands are never deleted once products reference them, so this is how
    /// a brand you no longer stock disappears from the add-product dropdown.
    /// </summary>
    public bool IsActive { get; set; } = true;
}

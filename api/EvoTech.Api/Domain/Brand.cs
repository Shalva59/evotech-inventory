namespace EvoTech.Api.Domain;

public class Brand
{
    public long Id { get; set; }
    public required string Name { get; set; }

    public bool IsActive { get; set; } = true;
}

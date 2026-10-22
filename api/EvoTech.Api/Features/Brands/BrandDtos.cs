namespace EvoTech.Api.Features.Brands;

/// <summary>What the API returns. Never the entity itself.</summary>
public record BrandResponse(long Id, string Name, bool IsActive);

public record CreateBrandRequest(string Name, bool IsActive);


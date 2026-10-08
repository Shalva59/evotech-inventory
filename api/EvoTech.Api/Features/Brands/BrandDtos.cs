namespace EvoTech.Api.Features.Brands;

public record BrandResponse(long Id, string Name, bool IsActive);

public record CreateBrandRequest(string Name, bool IsActive);

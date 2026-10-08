namespace EvoTech.Api.Features.Products;

public record ProductResponse(
    long Id,
    string Sku,
    string? Barcode,
    string Name,
    long BrandId,
    string BrandName,
    long CategoryId,
    string CategoryName,
    decimal CostPrice,
    decimal SellPrice,
    int MinStockThreshold,
    bool IsArchived,
    int Quantity);

public record CreateProductRequest(
    string Sku,
    string? Barcode,
    string Name,
    long BrandId,
    long CategoryId,
    decimal CostPrice,
    decimal SellPrice,
    int MinStockThreshold);

public record UpdateProductRequest(
    string Sku,
    string? Barcode,
    string Name,
    long BrandId,
    long CategoryId,
    decimal CostPrice,
    decimal SellPrice,
    int MinStockThreshold,
    bool IsArchived);

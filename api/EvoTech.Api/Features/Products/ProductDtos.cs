namespace EvoTech.Api.Features.Products;

/// <summary>
/// Ids and names for both relations: ids so an edit form can preselect its
/// dropdowns, names so a table renders without extra requests.
///
/// Quantity is DERIVED — the sum of this product's stock movements, computed
/// per row in the same query. There is no quantity column anywhere.
/// </summary>
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

/// <summary>
/// PUT semantics: this is the product's complete new state, not a patch.
/// Whatever arrives replaces what is stored, so every field is required and
/// omitting one is not "leave it alone" — it is "set it to the default".
///
/// That is the trade for avoiding the omitted-vs-null ambiguity: no hidden
/// merge logic, at the cost of the client needing the whole object.
/// </summary>
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

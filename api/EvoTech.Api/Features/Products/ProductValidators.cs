using FluentValidation;

namespace EvoTech.Api.Features.Products;

/// <summary>
/// Shared rules. Create and Update accept the same fields, so the rules live
/// in one place rather than being copied and drifting apart.
///
/// The parameters are IRuleBuilderInitial, not IRuleBuilder: Cascade() is an
/// extension on the *initial* builder only — the one RuleFor() hands back
/// before any rule has been chained onto it.
/// </summary>
internal static class ProductRules
{
    // numeric(12,2) — 12 digits total, 2 after the point.
    private const decimal MaxMoney = 9_999_999_999.99m;

    public static IRuleBuilderOptions<T, string> Sku<T>(IRuleBuilderInitial<T, string> rule) =>
        rule.Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(50).WithMessage("SKU cannot exceed 50 characters.");

    public static IRuleBuilderOptions<T, string> Name<T>(IRuleBuilderInitial<T, string> rule) =>
        rule.Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters.");

    public static IRuleBuilderOptions<T, string?> Barcode<T>(IRuleBuilderInitial<T, string?> rule) =>
        rule.MaximumLength(50).WithMessage("Barcode cannot exceed 50 characters.");

    public static IRuleBuilderOptions<T, decimal> Money<T>(IRuleBuilderInitial<T, decimal> rule, string field) =>
        rule.Cascade(CascadeMode.Stop)
            .GreaterThanOrEqualTo(0).WithMessage($"{field} cannot be negative.")
            .LessThanOrEqualTo(MaxMoney).WithMessage($"{field} is too large.")
            // The column is numeric(12,2). Postgres would silently ROUND a
            // third decimal place rather than reject it, so 10.999 would
            // quietly become 11.00. Better to refuse than to change the
            // caller's number behind their back.
            .Must(v => decimal.Round(v, 2) == v)
                .WithMessage($"{field} cannot have more than 2 decimal places.");

    public static IRuleBuilderOptions<T, long> ForeignKey<T>(IRuleBuilderInitial<T, long> rule, string field) =>
        rule.GreaterThan(0).WithMessage($"{field} must be a positive id.");

    public static IRuleBuilderOptions<T, int> Threshold<T>(IRuleBuilderInitial<T, int> rule) =>
        rule.GreaterThanOrEqualTo(0)
            .WithMessage("Minimum stock threshold cannot be negative.");
}

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        ProductRules.Sku(RuleFor(x => x.Sku));
        ProductRules.Name(RuleFor(x => x.Name));
        ProductRules.Barcode(RuleFor(x => x.Barcode));
        ProductRules.ForeignKey(RuleFor(x => x.BrandId), "BrandId");
        ProductRules.ForeignKey(RuleFor(x => x.CategoryId), "CategoryId");
        ProductRules.Money(RuleFor(x => x.CostPrice), "Cost price");
        ProductRules.Money(RuleFor(x => x.SellPrice), "Sell price");
        ProductRules.Threshold(RuleFor(x => x.MinStockThreshold));
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        ProductRules.Sku(RuleFor(x => x.Sku));
        ProductRules.Name(RuleFor(x => x.Name));
        ProductRules.Barcode(RuleFor(x => x.Barcode));
        ProductRules.ForeignKey(RuleFor(x => x.BrandId), "BrandId");
        ProductRules.ForeignKey(RuleFor(x => x.CategoryId), "CategoryId");
        ProductRules.Money(RuleFor(x => x.CostPrice), "Cost price");
        ProductRules.Money(RuleFor(x => x.SellPrice), "Sell price");
        ProductRules.Threshold(RuleFor(x => x.MinStockThreshold));
    }
}

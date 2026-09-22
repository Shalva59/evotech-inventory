using EvoTech.Api.Domain;
using FluentValidation;

namespace EvoTech.Api.Features.StockMovements;

public class CreateStockMovementRequestValidator : AbstractValidator<CreateStockMovementRequest>
{
    private const decimal MaxMoney = 9_999_999_999.99m;

    public CreateStockMovementRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("ProductId must be a positive id.");

        // Always positive. The sign is derived from Kind, so a negative here
        // would be ambiguous rather than useful.
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        // IsInEnum matters because the JSON converter will happily bind an
        // undefined numeric value to an enum — (StockMovementKind)99 is a
        // legal value of the type, and would then fail the database CHECK
        // with a much worse error.
        RuleFor(x => x.Kind)
            .IsInEnum().WithMessage("Kind must be Purchase, Sale or Adjustment.");

        // ---- The conditional rules ----
        // This pair is why FluentValidation is here: neither can be written as
        // a data annotation, because each depends on another property.

        RuleFor(x => x.Direction)
            .NotNull()
            .When(x => x.Kind == StockMovementKind.Adjustment)
            .WithMessage("Direction is required for an adjustment.");

        RuleFor(x => x.Direction)
            .Null()
            .When(x => x.Kind != StockMovementKind.Adjustment)
            .WithMessage("Direction applies only to an adjustment — Purchase and Sale imply their own.");

        RuleFor(x => x.UnitCost)
            .Null()
            .When(x => x.Kind != StockMovementKind.Purchase)
            .WithMessage("Unit cost applies only to a purchase.");

        // OverridePropertyName on both: unwrapping the nullable with .Value
        // makes FluentValidation derive the key "UnitCost.Value" from the
        // expression, and a client cannot map that back to a field it sent.
        RuleFor(x => x.UnitCost!.Value)
            .Cascade(CascadeMode.Stop)
            .GreaterThanOrEqualTo(0).WithMessage("Unit cost cannot be negative.")
            .LessThanOrEqualTo(MaxMoney).WithMessage("Unit cost is too large.")
            // The column is numeric(12,2); Postgres would silently round a
            // third decimal rather than reject it.
            .Must(v => decimal.Round(v, 2) == v)
                .WithMessage("Unit cost cannot have more than 2 decimal places.")
            .When(x => x.UnitCost.HasValue)
            .OverridePropertyName(nameof(CreateStockMovementRequest.UnitCost));

        RuleFor(x => x.OccurredAt!.Value)
            .LessThanOrEqualTo(_ => DateTimeOffset.UtcNow)
            .When(x => x.OccurredAt.HasValue)
            .WithMessage("OccurredAt cannot be in the future.")
            .OverridePropertyName(nameof(CreateStockMovementRequest.OccurredAt));

        RuleFor(x => x.Note)
            .MaximumLength(500).WithMessage("Note cannot exceed 500 characters.");
    }
}

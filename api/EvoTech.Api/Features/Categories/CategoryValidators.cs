using FluentValidation;

namespace EvoTech.Api.Features.Categories;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100).WithMessage("Category name cannot exceed 100 characters.");

        // Shape only. Whether the parent actually EXISTS is a database
        // question, so it lives in the controller — a validator that queries
        // the database is possible with FluentValidation, but it hides a query
        // somewhere you would not think to look for one.
        RuleFor(x => x.ParentId)
            .GreaterThan(0).WithMessage("ParentId must be a positive id.")
            .When(x => x.ParentId.HasValue);
    }
}

public class RenameCategoryRequestValidator : AbstractValidator<RenameCategoryRequest>
{
    public RenameCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100).WithMessage("Category name cannot exceed 100 characters.");
    }
}

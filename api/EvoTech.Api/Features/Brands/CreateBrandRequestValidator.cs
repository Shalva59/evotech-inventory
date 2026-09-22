using FluentValidation;

namespace EvoTech.Api.Features.Brands;

public class CreateBrandRequestValidator : AbstractValidator<CreateBrandRequest>
{
    public CreateBrandRequestValidator()
    {
        RuleFor(x => x.Name)
            // Stop at the first failure for this property. Without it every
            // rule runs and the client gets a pile of messages describing the
            // same problem.
            .Cascade(CascadeMode.Stop)
            // NotEmpty() covers null, "" AND whitespace-only — it is not the
            // same as string.IsNullOrEmpty. No separate whitespace rule needed.
            .NotEmpty().WithMessage("Brand name is required.")
            .MaximumLength(100).WithMessage("Brand name cannot exceed 100 characters.");
    }
}

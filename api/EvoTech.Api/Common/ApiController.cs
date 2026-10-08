using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace EvoTech.Api.Common;

[ApiController]
public abstract class ApiController : ControllerBase
{
    protected async Task<ActionResult?> ValidateAsync<T>(T request, CancellationToken ct = default)
    {
        var validator = HttpContext.RequestServices.GetService<IValidator<T>>();
        if (validator is null) return null;

        var result = await validator.ValidateAsync(request!, ct);
        if (result.IsValid) return null;

        foreach (var error in result.Errors)
            ModelState.AddModelError(error.PropertyName, error.ErrorMessage);

        return ValidationProblem(ModelState);
    }
}

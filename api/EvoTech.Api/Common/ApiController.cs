using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace EvoTech.Api.Common;

/// <summary>
/// Base class for every controller in this API. Holds the shared plumbing so
/// individual controllers stay about their own feature.
/// </summary>
[ApiController]
public abstract class ApiController : ControllerBase
{
    /// <summary>
    /// Runs the registered FluentValidation validator for <paramref name="request"/>.
    /// Returns null when valid, or a 400 ValidationProblem when not.
    ///
    /// Deliberately explicit: nothing runs this for you, so every validated
    /// endpoint has a visible call. Grep for ValidateAsync and you have the
    /// complete list. The trade is that a forgotten call is an unvalidated
    /// endpoint — an action filter would make that impossible, at the cost of
    /// being invisible.
    /// </summary>
    /// <remarks>
    /// Returns ActionResult, not IActionResult: ActionResult has an implicit
    /// conversion to ActionResult&lt;T&gt;, so callers declaring
    /// ActionResult&lt;BrandResponse&gt; can `return problem;` directly.
    /// IActionResult has no such conversion and would not compile.
    /// </remarks>
    protected async Task<ActionResult?> ValidateAsync<T>(T request, CancellationToken ct = default)
    {
        // GetService, not GetRequiredService: a request type with no validator
        // is a legitimate case (nothing to check), not a configuration error.
        var validator = HttpContext.RequestServices.GetService<IValidator<T>>();
        if (validator is null) return null;

        var result = await validator.ValidateAsync(request!, ct);
        if (result.IsValid) return null;

        // Copy FluentValidation's errors into ModelState so the response is a
        // standard RFC 7807 ValidationProblemDetails — identical in shape to
        // the 400s the framework produces for binding failures.
        foreach (var error in result.Errors)
            ModelState.AddModelError(error.PropertyName, error.ErrorMessage);

        return ValidationProblem(ModelState);
    }
}

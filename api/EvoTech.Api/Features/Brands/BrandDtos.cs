namespace EvoTech.Api.Features.Brands;

/// <summary>What the API returns. Never the entity itself.</summary>
public record BrandResponse(long Id, string Name, bool IsActive);

/// <summary>
/// What the API accepts when creating a brand. No Id and no IsActive — the
/// client does not get to choose either.
///
/// Deliberately carries NO validation attributes. [ApiController] auto-rejects
/// a request whose ModelState is invalid *before* the action runs, so any
/// annotation here would shadow the FluentValidation rules and produce the
/// framework's message instead of ours — invisibly. With them gone, every
/// semantic rule lives in CreateBrandRequestValidator and runs through the
/// visible ValidateAsync call in the controller.
///
/// The auto-filter still handles pure binding failures (a number where a
/// string belongs, malformed JSON). That is the framework's job, not ours.
///
/// Known cost: the OpenAPI document no longer advertises these constraints,
/// so a generated client will not know Name has a maximum length.
/// </summary>
public record CreateBrandRequest(string Name);

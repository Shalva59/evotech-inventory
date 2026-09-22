namespace EvoTech.Api.Features.Categories;

/// <summary>
/// One row of the flat tree. ParentId is null for a root. Depth is included
/// so a client can indent without walking parents first.
/// </summary>
public record CategoryResponse(long Id, long? ParentId, string Name, int Depth);

/// <summary>ParentId null creates a root category.</summary>
public record CreateCategoryRequest(string Name, long? ParentId);

/// <summary>
/// Rename only. Re-parenting is deliberately not supported here: moving a node
/// means recomputing Depth for every descendant and rejecting a move into the
/// node's own subtree. That belongs in its own endpoint with its own tests.
/// </summary>
public record RenameCategoryRequest(string Name);

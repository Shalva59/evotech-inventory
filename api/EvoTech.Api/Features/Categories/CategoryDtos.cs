namespace EvoTech.Api.Features.Categories;

public record CategoryResponse(long Id, long? ParentId, string Name, int Depth);

public record CreateCategoryRequest(string Name, long? ParentId);

public record RenameCategoryRequest(string Name);

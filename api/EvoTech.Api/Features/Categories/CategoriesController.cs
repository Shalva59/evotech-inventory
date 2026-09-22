using EvoTech.Api.Common;
using EvoTech.Api.Data;
using EvoTech.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace EvoTech.Api.Features.Categories;

[Route("api/v1/categories")]
public class CategoriesController(AppDbContext db) : ApiController
{
    /// <summary>
    /// The whole tree, flat. The client assembles it from ParentId.
    ///
    /// Ordered by Depth then Name so parents always appear before their
    /// children — which means a single pass is enough to build the tree
    /// client-side, with no second lookup for a parent that has not been seen
    /// yet.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryResponse>>> GetAll(CancellationToken ct)
    {
        var categories = await db.Categories
            .OrderBy(c => c.Depth).ThenBy(c => c.Name)
            .Select(c => new CategoryResponse(c.Id, c.ParentId, c.Name, c.Depth))
            .ToListAsync(ct);

        return Ok(categories);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<CategoryResponse>> GetById(long id, CancellationToken ct)
    {
        var category = await db.Categories
            .Where(c => c.Id == id)
            .Select(c => new CategoryResponse(c.Id, c.ParentId, c.Name, c.Depth))
            .SingleOrDefaultAsync(ct);

        return category is null ? NotFound(id) : Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(
        CreateCategoryRequest request,
        CancellationToken ct)
    {
        if (await ValidateAsync(request, ct) is { } problem) return problem;

        // Depth is derived, never supplied by the client: a root is 0, and any
        // other node is its parent's depth plus one. Computing it in exactly
        // one place is what keeps it trustworthy.
        var depth = 0;

        if (request.ParentId is { } parentId)
        {
            // Only Depth is needed, so select only Depth. Cast to int? so that
            // "no such parent" and "parent at depth 0" stay distinguishable —
            // without the cast, a missing row and a root parent both return 0.
            var parentDepth = await db.Categories
                .Where(c => c.Id == parentId)
                .Select(c => (int?)c.Depth)
                .SingleOrDefaultAsync(ct);

            if (parentDepth is null)
            {
                ModelState.AddModelError(nameof(request.ParentId),
                    $"No category with id {parentId}.");
                return ValidationProblem(ModelState);
            }

            depth = parentDepth.Value + 1;
        }

        var category = new Category
        {
            Name = request.Name,
            ParentId = request.ParentId,
            Depth = depth
        };

        db.Categories.Add(category);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            return DuplicateSibling(request.Name);
        }

        var response = new CategoryResponse(category.Id, category.ParentId, category.Name, category.Depth);
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, response);
    }

    [HttpPatch("{id:long}")]
    public async Task<ActionResult<CategoryResponse>> Rename(
        long id,
        RenameCategoryRequest request,
        CancellationToken ct)
    {
        if (await ValidateAsync(request, ct) is { } problem) return problem;

        // No projection here: this one has to be a TRACKED entity, because the
        // change tracker is what turns an assignment into an UPDATE statement.
        var category = await db.Categories.SingleOrDefaultAsync(c => c.Id == id, ct);
        if (category is null) return NotFound(id);

        // Renaming to the current name is a no-op, not an error. Returning
        // early also avoids a pointless round trip.
        if (category.Name == request.Name)
            return Ok(new CategoryResponse(category.Id, category.ParentId, category.Name, category.Depth));

        category.Name = request.Name;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            // Same unique index as on insert — a sibling already has this name.
            return DuplicateSibling(request.Name);
        }

        return Ok(new CategoryResponse(category.Id, category.ParentId, category.Name, category.Depth));
    }

    private ObjectResult NotFound(long id) =>
        Problem(statusCode: StatusCodes.Status404NotFound,
                title: "Category not found",
                detail: $"No category with id {id}.");

    private ObjectResult DuplicateSibling(string name) =>
        Problem(statusCode: StatusCodes.Status409Conflict,
                title: "Category already exists",
                detail: $"A category named '{name}' already exists under the same parent.");
}

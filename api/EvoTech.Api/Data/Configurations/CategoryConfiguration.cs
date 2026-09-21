using EvoTech.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EvoTech.Api.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(100);

        // Depth is derived (Parent.Depth + 1, roots at 0). The constraint
        // cannot prove it is correct, but it can stop it being absurd.
        builder.ToTable(t => t.HasCheckConstraint("ck_category_depth", "depth >= 0"));

        // ---- The self-reference ----
        // Restrict: deleting a category that still has children is refused by
        // Postgres. On an arbitrary-depth tree, cascade would let one click
        // remove a whole branch.
        builder.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // ---- Sibling names must differ ----
        // Unique on (ParentId, Name), so 'Screens' can exist under both Phones
        // and Tablets, but not twice under the same parent.
        //
        // AreNullsDistinct(false) is the important part. By default SQL treats
        // every NULL as distinct from every other NULL, so root categories —
        // which have ParentId = NULL — would escape this constraint entirely
        // and you could create ten roots called 'Accessories'. Postgres 15+
        // supports UNIQUE NULLS NOT DISTINCT, which closes that hole without
        // needing a second partial index.
        builder.HasIndex(c => new { c.ParentId, c.Name })
            .IsUnique()
            .AreNullsDistinct(false);

        // No separate index on ParentId: it is the leading column of the index
        // above, so lookups of "children of X" already use it.
    }
}

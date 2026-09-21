using EvoTech.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EvoTech.Api.Data.Configurations;

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(100);

        // One 'Apple' in the whole database — the point of a global brand.
        // Note this is CASE-SENSITIVE: 'Apple' and 'apple' are both allowed.
        builder.HasIndex(b => b.Name)
            .IsUnique();

        // The C# property already defaults to true. Setting it here too means
        // a row inserted by raw SQL — a seed script, a manual fix in psql —
        // also gets true instead of failing on a NOT NULL with no value.
        builder.Property(b => b.IsActive)
            .HasDefaultValue(true);
    }
}

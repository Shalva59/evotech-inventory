using EvoTech.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EvoTech.Api.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Sku)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Barcode)
            .HasMaxLength(50);

        // ---- Money ----
        // Without HasPrecision, Npgsql maps decimal to unconstrained numeric.
        // That stores correctly but accepts 3.14159 as a price, and nothing
        // stops it. 12 digits total, 2 after the point: up to 9,999,999,999.99
        builder.Property(p => p.CostPrice).HasPrecision(12, 2);
        builder.Property(p => p.SellPrice).HasPrecision(12, 2);

        // ---- Unique codes ----
        // Sku is required, so this is a straightforward unique index.
        builder.HasIndex(p => p.Sku)
            .IsUnique();

        // Barcode is nullable, and here the DEFAULT null behaviour is exactly
        // what we want — the opposite of the Category case. SQL treats every
        // NULL as distinct, so any number of products may have no barcode,
        // while two products may not share one. No AreNullsDistinct call.
        builder.HasIndex(p => p.Barcode)
            .IsUnique();

        // ---- Sanity constraints ----
        // Cheap, and they hold no matter what code does the writing.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_product_prices_non_negative",
                "cost_price >= 0 AND sell_price >= 0");
            t.HasCheckConstraint("ck_product_min_stock_threshold_non_negative",
                "min_stock_threshold >= 0");

            // IsRequired() only emits NOT NULL, and '' passes NOT NULL. This
            // is the constraint that actually makes a SKU mean something.
            t.HasCheckConstraint("ck_product_sku_not_empty",
                "sku <> ''");
        });

        builder.Property(p => p.IsArchived)
            .HasDefaultValue(false);

        // ---- Relationships ----
        // Restrict on both: a brand or category that still has products cannot
        // be deleted. The API turns that into a clear error rather than
        // silently destroying catalogue data.
        //
        // No WithMany(...) argument because Brand and Category have no inverse
        // collection — the relationship is fully defined by the FK here.
        builder.HasOne(p => p.Brand)
            .WithMany()
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // No explicit index on BrandId or CategoryId: EF creates an index for
        // every foreign key by convention. Postgres does NOT do this on its
        // own — unlike the primary key, a FK gets no index automatically — so
        // that convention is quietly saving you two slow queries.
    }
}

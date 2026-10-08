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

        builder.Property(p => p.CostPrice).HasPrecision(12, 2);
        builder.Property(p => p.SellPrice).HasPrecision(12, 2);

        builder.HasIndex(p => p.Sku)
            .IsUnique();

        builder.HasIndex(p => p.Barcode)
            .IsUnique();

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_product_prices_non_negative",
                "cost_price >= 0 AND sell_price >= 0");
            t.HasCheckConstraint("ck_product_min_stock_threshold_non_negative",
                "min_stock_threshold >= 0");

            t.HasCheckConstraint("ck_product_sku_not_empty",
                "sku <> ''");
        });

        builder.Property(p => p.IsArchived)
            .HasDefaultValue(false);

        builder.HasOne(p => p.Brand)
            .WithMany()
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

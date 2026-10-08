using EvoTech.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EvoTech.Api.Data.Configurations;

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Kind)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(m => m.Note)
            .HasMaxLength(500);

        builder.Property(m => m.UnitCost)
            .HasPrecision(12, 2);

        builder.Property(m => m.CreatedAt)
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_stock_movement_quantity_not_zero",
                "quantity <> 0");

            t.HasCheckConstraint("ck_stock_movement_kind",
                "kind IN ('Purchase', 'Sale', 'Adjustment')");

            t.HasCheckConstraint("ck_stock_movement_unit_cost_non_negative",
                "unit_cost IS NULL OR unit_cost >= 0");
        });

        builder.HasOne(m => m.Product)
            .WithMany(p => p.Movements)
            .HasForeignKey(m => m.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => new { m.ProductId, m.OccurredAt });
    }
}

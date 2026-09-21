using EvoTech.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EvoTech.Api.Data.Configurations;

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.HasKey(m => m.Id);

        // ---- The enum, as text ----
        // Stores 'Purchase' / 'Sale' / 'Adjustment' rather than 0 / 1 / 2, so
        // the column is readable in psql and reordering the C# enum is safe.
        builder.Property(m => m.Kind)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(m => m.Note)
            .HasMaxLength(500);

        builder.Property(m => m.UnitCost)
            .HasPrecision(12, 2);

        // ---- CreatedAt comes from the database clock ----
        // ValueGeneratedOnAdd tells EF not to send a value on INSERT and to
        // read back whatever Postgres assigned. Without it EF would send
        // default(DateTimeOffset) — 0001-01-01 — and the default would never
        // apply, because a supplied value is still a value.
        builder.Property(m => m.CreatedAt)
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        // ---- Constraints the database enforces itself ----
        builder.ToTable(t =>
        {
            // A movement of nothing is not an event.
            t.HasCheckConstraint("ck_stock_movement_quantity_not_zero",
                "quantity <> 0");

            // The text enum's safety net. EF's HasConversion only validates on
            // the C# side; without this, any string at all can be written by
            // raw SQL. Remember to extend this when you add a kind.
            t.HasCheckConstraint("ck_stock_movement_kind",
                "kind IN ('Purchase', 'Sale', 'Adjustment')");

            // Cost is per unit and cannot be negative. NULL is fine — it only
            // applies to Purchase — and a CHECK passes when the value is NULL,
            // which is the standard three-valued-logic behaviour worth
            // remembering: UNKNOWN is not a violation.
            t.HasCheckConstraint("ck_stock_movement_unit_cost_non_negative",
                "unit_cost IS NULL OR unit_cost >= 0");
        });

        // ---- Relationship ----
        // Restrict: a product with history cannot be deleted. IsArchived is
        // how a product leaves the catalogue.
        builder.HasOne(m => m.Product)
            .WithMany()
            .HasForeignKey(m => m.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // ---- Index ----
        // Every stock question is "this product, over this period": the
        // running balance, the history view, the low-stock check. Leading on
        // ProductId means it also serves plain "all movements for product X",
        // so this replaces the plain FK index EF would otherwise create.
        builder.HasIndex(m => new { m.ProductId, m.OccurredAt });
    }
}

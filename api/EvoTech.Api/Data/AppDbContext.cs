using EvoTech.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace EvoTech.Api.Data;

/// <summary>
/// The first file in this project allowed to reference EF Core. Domain/ knows
/// nothing about persistence; everything EF-shaped lives here and in
/// Data/Configurations/.
///
/// Note there is no OnConfiguring override. The connection string is supplied
/// by DI from Program.cs, which keeps the database choice out of this class
/// and the credentials out of source control.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Picks up every IEntityTypeConfiguration<T> in this assembly. The
        // alternative — one ApplyConfiguration call per entity — is a line
        // you will eventually forget to add.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

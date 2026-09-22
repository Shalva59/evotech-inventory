using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductSkuNotEmptyCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "ck_product_sku_not_empty",
                table: "products",
                sql: "sku <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_product_sku_not_empty",
                table: "products");
        }
    }
}

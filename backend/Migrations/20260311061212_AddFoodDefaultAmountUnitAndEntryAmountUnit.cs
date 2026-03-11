using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFoodDefaultAmountUnitAndEntryAmountUnit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Grams",
                table: "meal_entries",
                newName: "Amount");

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "meal_entries",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "g");

            migrationBuilder.AddColumn<int>(
                name: "DefaultAmount",
                table: "foods",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "DefaultUnit",
                table: "foods",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "g");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unit",
                table: "meal_entries");

            migrationBuilder.DropColumn(
                name: "DefaultAmount",
                table: "foods");

            migrationBuilder.DropColumn(
                name: "DefaultUnit",
                table: "foods");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "meal_entries",
                newName: "Grams");
        }
    }
}

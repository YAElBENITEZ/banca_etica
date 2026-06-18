using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class CorregirColumnaNombreCajita : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Nombre",
                table: "Historiales");

            migrationBuilder.AddColumn<string>(
                name: "Nombre",
                table: "Cajitas",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Nombre",
                table: "Cajitas");

            migrationBuilder.AddColumn<string>(
                name: "Nombre",
                table: "Historiales",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}

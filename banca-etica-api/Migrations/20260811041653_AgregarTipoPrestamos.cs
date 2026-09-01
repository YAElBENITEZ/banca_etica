using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTipoPrestamos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Prestamos",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Prestamos");
        }
    }
}

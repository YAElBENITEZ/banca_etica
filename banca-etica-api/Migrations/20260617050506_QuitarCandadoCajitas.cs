using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class QuitarCandadoCajitas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
           // migrationBuilder.DropIndex(
            //    name: "IX_Cajitas_UsuarioId",
              //  table: "Cajitas");

            migrationBuilder.CreateIndex(
                name: "IX_Cajitas_UsuarioId",
                table: "Cajitas",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Cajitas_UsuarioId",
                table: "Cajitas");

            migrationBuilder.CreateIndex(
                name: "IX_Cajitas_UsuarioId",
                table: "Cajitas",
                column: "UsuarioId",
                unique: true);
        }
    }
}

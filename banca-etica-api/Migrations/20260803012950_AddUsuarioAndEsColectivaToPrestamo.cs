using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class AddUsuarioAndEsColectivaToPrestamo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EsColectivo",
                table: "Prestamos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "Prestamos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EsColectivo",
                table: "Prestamos");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Prestamos");
        }
    }
}

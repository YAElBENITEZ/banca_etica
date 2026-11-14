using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRegistroComplementarioSocio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Celular",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Curp",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreBeneficiario",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Rfc",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoSocio",
                table: "Usuarios",
                type: "text",
                nullable: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Celular",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Curp",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "NombreBeneficiario",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Rfc",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TipoSocio",
                table: "Usuarios");

        }
    }
}

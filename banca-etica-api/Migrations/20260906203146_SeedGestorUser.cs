using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class SeedGestorUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "ApellidoMaterno", "ApellidoPaterno", "ConsentimientoArco", "CooperativaId", "Correo", "Direccion", "Estatus", "FechaNacimiento", "FechaRegistro", "Nombres", "NumeroSocio", "PasswordHash", "RolId", "Telefono" },
                values: new object[] { new Guid("99999999-9999-9999-9999-999999999999"), "General", "Gestor", true, null, "gestor@bancaetica.com", null, "ACTIVO", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Administrador", null, "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", new Guid("11111111-1111-1111-1111-111111111111"), null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"));
        }
    }
}

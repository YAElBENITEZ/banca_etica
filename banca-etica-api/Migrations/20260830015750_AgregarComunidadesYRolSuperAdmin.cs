using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarComunidadesYRolSuperAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ComunidadId",
                table: "Usuarios",
                type: "uuid",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "Descripcion",
                value: "Administrador de la comunidad");

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Descripcion", "Nombre" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000001"), "Superadministrador global del sistema y gestión de comunidades", "SuperAdmin" });

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_ComunidadId",
                table: "Usuarios",
                column: "ComunidadId");

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Comunidades_ComunidadId",
                table: "Usuarios",
                column: "ComunidadId",
                principalTable: "Comunidades",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Comunidades_ComunidadId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_ComunidadId",
                table: "Usuarios");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));

            migrationBuilder.DropColumn(
                name: "ComunidadId",
                table: "Usuarios");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "Descripcion",
                value: "Administrador total del sistema");
        }
    }
}

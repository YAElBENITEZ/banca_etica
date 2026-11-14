using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTablaSolicitudesPrestamos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SolicitudPrestamoId",
                table: "Prestamos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SolicitudesPrestamos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    CooperativaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadSolicitada = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NumeroContactoInmediato = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    Estatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FechaSolicitud = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaResolucion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PrestamoId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitudesPrestamos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SolicitudesPrestamos_Cooperativas_CooperativaId",
                        column: x => x.CooperativaId,
                        principalTable: "Cooperativas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SolicitudesPrestamos_Prestamos_PrestamoId",
                        column: x => x.PrestamoId,
                        principalTable: "Prestamos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SolicitudesPrestamos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"),
                column: "PasswordHash",
                value: "$2a$11$UhE3LZmKJu/Mic5L5x4pdefzcAt4ltm4HSnyjVMuiQ9O39nSpmev2");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesPrestamos_CooperativaId",
                table: "SolicitudesPrestamos",
                column: "CooperativaId");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesPrestamos_PrestamoId",
                table: "SolicitudesPrestamos",
                column: "PrestamoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesPrestamos_UsuarioId",
                table: "SolicitudesPrestamos",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SolicitudesPrestamos");

            migrationBuilder.DropColumn(
                name: "SolicitudPrestamoId",
                table: "Prestamos");

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"),
                column: "PasswordHash",
                value: "$2a$11$QFWxOOIT4/TEbO.duLgCsuhlAT8.xcvMnI3dKZ/1MXqJtDNaGCVN6");
        }
    }
}

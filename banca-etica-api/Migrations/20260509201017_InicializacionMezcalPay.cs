using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class InicializacionMezcalPay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NombreCompleto = table.Column<string>(type: "text", nullable: false),
                    Telefono = table.Column<string>(type: "text", nullable: false),
                    Correo = table.Column<string>(type: "text", nullable: false),
                    Rol = table.Column<string>(type: "text", nullable: false),
                    EstatusMembresia = table.Column<string>(type: "text", nullable: false),
                    ConsentimientosArco = table.Column<bool>(type: "boolean", nullable: false),
                    UmbralAlertaSaldo = table.Column<decimal>(type: "numeric", nullable: false),
                    FechaAfiliacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Cajitas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    SaldoActual = table.Column<decimal>(type: "numeric", nullable: false),
                    PorcentajeAportacionFondo = table.Column<decimal>(type: "numeric", nullable: false),
                    EstadoSync = table.Column<string>(type: "text", nullable: false),
                    Proyeccion612Meses = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cajitas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cajitas_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ColaSincronizacion",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
                    OperacionPendienteJson = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Estado = table.Column<string>(type: "text", nullable: false),
                    ConflictoLWW = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColaSincronizacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ColaSincronizacion_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Lotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    VariedadAgave = table.Column<string>(type: "text", nullable: false),
                    Parcela = table.Column<string>(type: "text", nullable: false),
                    EtapasJson = table.Column<string>(type: "text", nullable: false),
                    RendimientoLitros = table.Column<float>(type: "real", nullable: false),
                    MermasKilos = table.Column<float>(type: "real", nullable: false),
                    GaleriaCrtJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Lotes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProgresosEducativos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    CapsulasAudioCompletadasJson = table.Column<string>(type: "text", nullable: false),
                    UsoCalculadoraRentabilidad = table.Column<bool>(type: "boolean", nullable: false),
                    GuiaSatRevisada = table.Column<bool>(type: "boolean", nullable: false),
                    FechaUltimaActividad = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgresosEducativos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgresosEducativos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reglamentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsejoAdministracionJson = table.Column<string>(type: "text", nullable: false),
                    ConsejoVigilanciaJson = table.Column<string>(type: "text", nullable: false),
                    TesoreroId = table.Column<Guid>(type: "uuid", nullable: false),
                    PeriodicidadAhorro = table.Column<string>(type: "text", nullable: false),
                    MontoMinimoAportacion = table.Column<decimal>(type: "numeric", nullable: false),
                    TasaInteresMensual = table.Column<decimal>(type: "numeric", nullable: false),
                    MultiploPrestamoMaximo = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reglamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reglamentos_Usuarios_TesoreroId",
                        column: x => x.TesoreroId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Historiales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CajitaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric", nullable: false),
                    TipoMovimiento = table.Column<string>(type: "text", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SaldoAcumulado = table.Column<decimal>(type: "numeric", nullable: false),
                    FirmaTesorero = table.Column<string>(type: "text", nullable: false),
                    TimestampAuditoria = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeviceIdOrigen = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Historiales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Historiales_Cajitas_CajitaId",
                        column: x => x.CajitaId,
                        principalTable: "Cajitas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Prestamos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CajitaId = table.Column<Guid>(type: "uuid", nullable: false),
                    MontoAprobado = table.Column<decimal>(type: "numeric", nullable: false),
                    TasaInteresAplicada = table.Column<decimal>(type: "numeric", nullable: false),
                    FechaDesembolso = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PlazoMeses = table.Column<int>(type: "integer", nullable: false),
                    Estado = table.Column<string>(type: "text", nullable: false),
                    AvalistasJson = table.Column<string>(type: "text", nullable: false),
                    TablaPagosJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prestamos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prestamos_Cajitas_CajitaId",
                        column: x => x.CajitaId,
                        principalTable: "Cajitas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Transacciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoteProduccionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Monto = table.Column<decimal>(type: "numeric", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    Cliente = table.Column<string>(type: "text", nullable: false),
                    CanalVenta = table.Column<string>(type: "text", nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: false),
                    MetadatosJson = table.Column<string>(type: "text", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeviceIdOrigen = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transacciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transacciones_Lotes_LoteProduccionId",
                        column: x => x.LoteProduccionId,
                        principalTable: "Lotes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Transacciones_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Fondos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReglamentoUnionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SaldoColectivo = table.Column<decimal>(type: "numeric", nullable: false),
                    ProyeccionFondo = table.Column<decimal>(type: "numeric", nullable: false),
                    HistorialIngresosJson = table.Column<string>(type: "text", nullable: false),
                    HistorialEgresosJson = table.Column<string>(type: "text", nullable: false),
                    FirmaDualConsejoJson = table.Column<string>(type: "text", nullable: false),
                    UltimaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fondos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fondos_Reglamentos_ReglamentoUnionId",
                        column: x => x.ReglamentoUnionId,
                        principalTable: "Reglamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cajitas_UsuarioId",
                table: "Cajitas",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ColaSincronizacion_UsuarioId",
                table: "ColaSincronizacion",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Fondos_ReglamentoUnionId",
                table: "Fondos",
                column: "ReglamentoUnionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Historiales_CajitaId",
                table: "Historiales",
                column: "CajitaId");

            migrationBuilder.CreateIndex(
                name: "IX_Lotes_UsuarioId",
                table: "Lotes",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_CajitaId",
                table: "Prestamos",
                column: "CajitaId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgresosEducativos_UsuarioId",
                table: "ProgresosEducativos",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reglamentos_TesoreroId",
                table: "Reglamentos",
                column: "TesoreroId");

            migrationBuilder.CreateIndex(
                name: "IX_Transacciones_LoteProduccionId",
                table: "Transacciones",
                column: "LoteProduccionId");

            migrationBuilder.CreateIndex(
                name: "IX_Transacciones_UsuarioId",
                table: "Transacciones",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ColaSincronizacion");

            migrationBuilder.DropTable(
                name: "Fondos");

            migrationBuilder.DropTable(
                name: "Historiales");

            migrationBuilder.DropTable(
                name: "Prestamos");

            migrationBuilder.DropTable(
                name: "ProgresosEducativos");

            migrationBuilder.DropTable(
                name: "Transacciones");

            migrationBuilder.DropTable(
                name: "Reglamentos");

            migrationBuilder.DropTable(
                name: "Cajitas");

            migrationBuilder.DropTable(
                name: "Lotes");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}

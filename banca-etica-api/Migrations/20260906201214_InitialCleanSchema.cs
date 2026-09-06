using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace banca_etica_api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCleanSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Aportaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PeriodoId = table.Column<Guid>(type: "uuid", nullable: false),
                    SocioId = table.Column<Guid>(type: "uuid", nullable: false),
                    TesoreroId = table.Column<Guid>(type: "uuid", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FolioComprobante = table.Column<string>(type: "text", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Aportaciones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ciclos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CooperativaId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DuracionMeses = table.Column<int>(type: "integer", nullable: false),
                    Estatus = table.Column<string>(type: "text", nullable: false),
                    FechaCierre = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ciclos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PeriodosAportacion",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CicloId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroPeriodo = table.Column<int>(type: "integer", nullable: false),
                    NombrePeriodo = table.Column<string>(type: "text", nullable: false),
                    FechaCorte = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PeriodosAportacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PeriodosAportacion_Ciclos_CicloId",
                        column: x => x.CicloId,
                        principalTable: "Ciclos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ConfiguracionesAportacion",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CooperativaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ManejaAportaciones = table.Column<bool>(type: "boolean", nullable: false),
                    Periodicidad = table.Column<string>(type: "text", nullable: false),
                    MontoMinimo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MontoMaximo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TipoMonto = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionesAportacion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConfiguracionesPrestamo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CooperativaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ManejaPrestamos = table.Column<bool>(type: "boolean", nullable: false),
                    MontoMinimo = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MontoMaximo = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FactorMaximo = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TasaInteres = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PeriodoInteres = table.Column<string>(type: "text", nullable: true),
                    FrecuenciaPago = table.Column<string>(type: "text", nullable: true),
                    PlazoMaximoMeses = table.Column<int>(type: "integer", nullable: true),
                    RequiereAval = table.Column<bool>(type: "boolean", nullable: false),
                    MultaMoroso = table.Column<decimal>(type: "numeric(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionesPrestamo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConfiguracionesRendimiento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CooperativaId = table.Column<Guid>(type: "uuid", nullable: false),
                    GeneraRendimientos = table.Column<bool>(type: "boolean", nullable: false),
                    Porcentaje = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PeriodicidadCalculo = table.Column<string>(type: "text", nullable: true),
                    FormaDistribucion = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionesRendimiento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Cooperativas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "text", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: true),
                    Ciudad = table.Column<string>(type: "text", nullable: true),
                    Estado = table.Column<string>(type: "text", nullable: true),
                    GestorId = table.Column<Guid>(type: "uuid", nullable: false),
                    TesoreroId = table.Column<Guid>(type: "uuid", nullable: true),
                    Estatus = table.Column<string>(type: "text", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cooperativas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RolId = table.Column<Guid>(type: "uuid", nullable: false),
                    CooperativaId = table.Column<Guid>(type: "uuid", nullable: true),
                    NumeroSocio = table.Column<string>(type: "text", nullable: true),
                    Nombres = table.Column<string>(type: "text", nullable: false),
                    ApellidoPaterno = table.Column<string>(type: "text", nullable: false),
                    ApellidoMaterno = table.Column<string>(type: "text", nullable: true),
                    FechaNacimiento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Telefono = table.Column<string>(type: "text", nullable: true),
                    Direccion = table.Column<string>(type: "text", nullable: true),
                    Correo = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    ConsentimientoArco = table.Column<bool>(type: "boolean", nullable: false),
                    Estatus = table.Column<string>(type: "text", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Cooperativas_CooperativaId",
                        column: x => x.CooperativaId,
                        principalTable: "Cooperativas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Usuarios_Roles_RolId",
                        column: x => x.RolId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DistribucionesCierre",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CicloId = table.Column<Guid>(type: "uuid", nullable: false),
                    SocioId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalAportado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RendimientosGenerados = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DeduccionesPrestamos = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalAEntregar = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Estatus = table.Column<string>(type: "text", nullable: false),
                    TesoreroEntregaId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaEntrega = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FolioComprobante = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DistribucionesCierre", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DistribucionesCierre_Ciclos_CicloId",
                        column: x => x.CicloId,
                        principalTable: "Ciclos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DistribucionesCierre_Usuarios_SocioId",
                        column: x => x.SocioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DistribucionesCierre_Usuarios_TesoreroEntregaId",
                        column: x => x.TesoreroEntregaId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Prestamos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CooperativaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CicloId = table.Column<Guid>(type: "uuid", nullable: false),
                    SocioId = table.Column<Guid>(type: "uuid", nullable: false),
                    AvalId = table.Column<Guid>(type: "uuid", nullable: true),
                    TesoreroId = table.Column<Guid>(type: "uuid", nullable: false),
                    MontoOriginal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TasaInteres = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Plazo = table.Column<int>(type: "integer", nullable: false),
                    SaldoPendiente = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Estatus = table.Column<string>(type: "text", nullable: false),
                    FechaOtorgamiento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FolioComprobante = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prestamos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prestamos_Ciclos_CicloId",
                        column: x => x.CicloId,
                        principalTable: "Ciclos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Prestamos_Cooperativas_CooperativaId",
                        column: x => x.CooperativaId,
                        principalTable: "Cooperativas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Prestamos_Usuarios_AvalId",
                        column: x => x.AvalId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Prestamos_Usuarios_SocioId",
                        column: x => x.SocioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Prestamos_Usuarios_TesoreroId",
                        column: x => x.TesoreroId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PagosPrestamo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PrestamoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TesoreroId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoPago = table.Column<string>(type: "text", nullable: false),
                    MontoBase = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Interes = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Multa = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalPagado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SaldoRestante = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FolioComprobante = table.Column<string>(type: "text", nullable: false),
                    FechaPago = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PagosPrestamo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PagosPrestamo_Prestamos_PrestamoId",
                        column: x => x.PrestamoId,
                        principalTable: "Prestamos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PagosPrestamo_Usuarios_TesoreroId",
                        column: x => x.TesoreroId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Descripcion", "Nombre" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "Administrador que crea cooperativas y configura reglas", "GESTOR" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "Operador financiero que registra movimientos en bitácora", "TESORERO" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "Usuario que consulta su historial, préstamos y comprobantes", "SOCIO" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Aportaciones_PeriodoId_SocioId",
                table: "Aportaciones",
                columns: new[] { "PeriodoId", "SocioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Aportaciones_SocioId",
                table: "Aportaciones",
                column: "SocioId");

            migrationBuilder.CreateIndex(
                name: "IX_Aportaciones_TesoreroId",
                table: "Aportaciones",
                column: "TesoreroId");

            migrationBuilder.CreateIndex(
                name: "IX_Ciclos_CooperativaId",
                table: "Ciclos",
                column: "CooperativaId");

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionesAportacion_CooperativaId",
                table: "ConfiguracionesAportacion",
                column: "CooperativaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionesPrestamo_CooperativaId",
                table: "ConfiguracionesPrestamo",
                column: "CooperativaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionesRendimiento_CooperativaId",
                table: "ConfiguracionesRendimiento",
                column: "CooperativaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cooperativas_Codigo",
                table: "Cooperativas",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cooperativas_GestorId",
                table: "Cooperativas",
                column: "GestorId");

            migrationBuilder.CreateIndex(
                name: "IX_Cooperativas_TesoreroId",
                table: "Cooperativas",
                column: "TesoreroId");

            migrationBuilder.CreateIndex(
                name: "IX_DistribucionesCierre_CicloId_SocioId",
                table: "DistribucionesCierre",
                columns: new[] { "CicloId", "SocioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DistribucionesCierre_SocioId",
                table: "DistribucionesCierre",
                column: "SocioId");

            migrationBuilder.CreateIndex(
                name: "IX_DistribucionesCierre_TesoreroEntregaId",
                table: "DistribucionesCierre",
                column: "TesoreroEntregaId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosPrestamo_PrestamoId",
                table: "PagosPrestamo",
                column: "PrestamoId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosPrestamo_TesoreroId",
                table: "PagosPrestamo",
                column: "TesoreroId");

            migrationBuilder.CreateIndex(
                name: "IX_PeriodosAportacion_CicloId",
                table: "PeriodosAportacion",
                column: "CicloId");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_AvalId",
                table: "Prestamos",
                column: "AvalId");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_CicloId",
                table: "Prestamos",
                column: "CicloId");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_CooperativaId",
                table: "Prestamos",
                column: "CooperativaId");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_SocioId",
                table: "Prestamos",
                column: "SocioId");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_TesoreroId",
                table: "Prestamos",
                column: "TesoreroId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_CooperativaId",
                table: "Usuarios",
                column: "CooperativaId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Correo",
                table: "Usuarios",
                column: "Correo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_RolId",
                table: "Usuarios",
                column: "RolId");

            migrationBuilder.AddForeignKey(
                name: "FK_Aportaciones_PeriodosAportacion_PeriodoId",
                table: "Aportaciones",
                column: "PeriodoId",
                principalTable: "PeriodosAportacion",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Aportaciones_Usuarios_SocioId",
                table: "Aportaciones",
                column: "SocioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Aportaciones_Usuarios_TesoreroId",
                table: "Aportaciones",
                column: "TesoreroId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Ciclos_Cooperativas_CooperativaId",
                table: "Ciclos",
                column: "CooperativaId",
                principalTable: "Cooperativas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ConfiguracionesAportacion_Cooperativas_CooperativaId",
                table: "ConfiguracionesAportacion",
                column: "CooperativaId",
                principalTable: "Cooperativas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ConfiguracionesPrestamo_Cooperativas_CooperativaId",
                table: "ConfiguracionesPrestamo",
                column: "CooperativaId",
                principalTable: "Cooperativas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ConfiguracionesRendimiento_Cooperativas_CooperativaId",
                table: "ConfiguracionesRendimiento",
                column: "CooperativaId",
                principalTable: "Cooperativas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Cooperativas_Usuarios_GestorId",
                table: "Cooperativas",
                column: "GestorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Cooperativas_Usuarios_TesoreroId",
                table: "Cooperativas",
                column: "TesoreroId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cooperativas_Usuarios_GestorId",
                table: "Cooperativas");

            migrationBuilder.DropForeignKey(
                name: "FK_Cooperativas_Usuarios_TesoreroId",
                table: "Cooperativas");

            migrationBuilder.DropTable(
                name: "Aportaciones");

            migrationBuilder.DropTable(
                name: "ConfiguracionesAportacion");

            migrationBuilder.DropTable(
                name: "ConfiguracionesPrestamo");

            migrationBuilder.DropTable(
                name: "ConfiguracionesRendimiento");

            migrationBuilder.DropTable(
                name: "DistribucionesCierre");

            migrationBuilder.DropTable(
                name: "PagosPrestamo");

            migrationBuilder.DropTable(
                name: "PeriodosAportacion");

            migrationBuilder.DropTable(
                name: "Prestamos");

            migrationBuilder.DropTable(
                name: "Ciclos");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Cooperativas");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}

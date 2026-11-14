CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "Roles" (
    "Id" uuid NOT NULL,
    "Nombre" text NOT NULL,
    "Descripcion" text,
    CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
);

CREATE TABLE "Aportaciones" (
    "Id" uuid NOT NULL,
    "PeriodoId" uuid NOT NULL,
    "SocioId" uuid NOT NULL,
    "TesoreroId" uuid NOT NULL,
    "Monto" numeric(18,2) NOT NULL,
    "FolioComprobante" text NOT NULL,
    "FechaRegistro" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Aportaciones" PRIMARY KEY ("Id")
);

CREATE TABLE "Ciclos" (
    "Id" uuid NOT NULL,
    "CooperativaId" uuid NOT NULL,
    "FechaInicio" timestamp with time zone NOT NULL,
    "FechaFin" timestamp with time zone NOT NULL,
    "DuracionMeses" integer NOT NULL,
    "Estatus" text NOT NULL,
    "FechaCierre" timestamp with time zone,
    CONSTRAINT "PK_Ciclos" PRIMARY KEY ("Id")
);

CREATE TABLE "PeriodosAportacion" (
    "Id" uuid NOT NULL,
    "CicloId" uuid NOT NULL,
    "NumeroPeriodo" integer NOT NULL,
    "NombrePeriodo" text NOT NULL,
    "FechaCorte" timestamp with time zone,
    CONSTRAINT "PK_PeriodosAportacion" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PeriodosAportacion_Ciclos_CicloId" FOREIGN KEY ("CicloId") REFERENCES "Ciclos" ("Id") ON DELETE CASCADE
);

CREATE TABLE "ConfiguracionesAportacion" (
    "Id" uuid NOT NULL,
    "CooperativaId" uuid NOT NULL,
    "ManejaAportaciones" boolean NOT NULL,
    "Periodicidad" text NOT NULL,
    "MontoMinimo" numeric(18,2) NOT NULL,
    "MontoMaximo" numeric(18,2) NOT NULL,
    "TipoMonto" text NOT NULL,
    CONSTRAINT "PK_ConfiguracionesAportacion" PRIMARY KEY ("Id")
);

CREATE TABLE "ConfiguracionesPrestamo" (
    "Id" uuid NOT NULL,
    "CooperativaId" uuid NOT NULL,
    "ManejaPrestamos" boolean NOT NULL,
    "MontoMinimo" numeric(18,2),
    "MontoMaximo" numeric(18,2),
    "FactorMaximo" numeric(18,2),
    "TasaInteres" numeric(18,2),
    "PeriodoInteres" text,
    "FrecuenciaPago" text,
    "PlazoMaximoMeses" integer,
    "RequiereAval" boolean NOT NULL,
    "MultaMoroso" numeric(18,2),
    CONSTRAINT "PK_ConfiguracionesPrestamo" PRIMARY KEY ("Id")
);

CREATE TABLE "ConfiguracionesRendimiento" (
    "Id" uuid NOT NULL,
    "CooperativaId" uuid NOT NULL,
    "GeneraRendimientos" boolean NOT NULL,
    "Porcentaje" numeric(18,2),
    "PeriodicidadCalculo" text,
    "FormaDistribucion" text,
    CONSTRAINT "PK_ConfiguracionesRendimiento" PRIMARY KEY ("Id")
);

CREATE TABLE "Cooperativas" (
    "Id" uuid NOT NULL,
    "Codigo" text NOT NULL,
    "Nombre" text NOT NULL,
    "Descripcion" text,
    "Ciudad" text,
    "Estado" text,
    "GestorId" uuid NOT NULL,
    "TesoreroId" uuid,
    "Estatus" text NOT NULL,
    "FechaCreacion" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Cooperativas" PRIMARY KEY ("Id")
);

CREATE TABLE "Usuarios" (
    "Id" uuid NOT NULL,
    "RolId" uuid NOT NULL,
    "CooperativaId" uuid,
    "NumeroSocio" text,
    "Nombres" text NOT NULL,
    "ApellidoPaterno" text NOT NULL,
    "ApellidoMaterno" text,
    "FechaNacimiento" timestamp with time zone,
    "Telefono" text,
    "Direccion" text,
    "Correo" text NOT NULL,
    "PasswordHash" text NOT NULL,
    "ConsentimientoArco" boolean NOT NULL,
    "Estatus" text NOT NULL,
    "FechaRegistro" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Usuarios" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Usuarios_Cooperativas_CooperativaId" FOREIGN KEY ("CooperativaId") REFERENCES "Cooperativas" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Usuarios_Roles_RolId" FOREIGN KEY ("RolId") REFERENCES "Roles" ("Id") ON DELETE CASCADE
);

CREATE TABLE "DistribucionesCierre" (
    "Id" uuid NOT NULL,
    "CicloId" uuid NOT NULL,
    "SocioId" uuid NOT NULL,
    "TotalAportado" numeric(18,2) NOT NULL,
    "RendimientosGenerados" numeric(18,2) NOT NULL,
    "DeduccionesPrestamos" numeric(18,2) NOT NULL,
    "TotalAEntregar" numeric(18,2) NOT NULL,
    "Estatus" text NOT NULL,
    "TesoreroEntregaId" uuid,
    "FechaEntrega" timestamp with time zone,
    "FolioComprobante" text,
    CONSTRAINT "PK_DistribucionesCierre" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_DistribucionesCierre_Ciclos_CicloId" FOREIGN KEY ("CicloId") REFERENCES "Ciclos" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_DistribucionesCierre_Usuarios_SocioId" FOREIGN KEY ("SocioId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_DistribucionesCierre_Usuarios_TesoreroEntregaId" FOREIGN KEY ("TesoreroEntregaId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Prestamos" (
    "Id" uuid NOT NULL,
    "CooperativaId" uuid NOT NULL,
    "CicloId" uuid NOT NULL,
    "SocioId" uuid NOT NULL,
    "AvalId" uuid,
    "TesoreroId" uuid NOT NULL,
    "MontoOriginal" numeric(18,2) NOT NULL,
    "TasaInteres" numeric(18,2) NOT NULL,
    "Plazo" integer NOT NULL,
    "SaldoPendiente" numeric(18,2) NOT NULL,
    "Estatus" text NOT NULL,
    "FechaOtorgamiento" timestamp with time zone NOT NULL,
    "FolioComprobante" text NOT NULL,
    CONSTRAINT "PK_Prestamos" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Prestamos_Ciclos_CicloId" FOREIGN KEY ("CicloId") REFERENCES "Ciclos" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Prestamos_Cooperativas_CooperativaId" FOREIGN KEY ("CooperativaId") REFERENCES "Cooperativas" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Prestamos_Usuarios_AvalId" FOREIGN KEY ("AvalId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Prestamos_Usuarios_SocioId" FOREIGN KEY ("SocioId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Prestamos_Usuarios_TesoreroId" FOREIGN KEY ("TesoreroId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "PagosPrestamo" (
    "Id" uuid NOT NULL,
    "PrestamoId" uuid NOT NULL,
    "TesoreroId" uuid NOT NULL,
    "TipoPago" text NOT NULL,
    "MontoBase" numeric(18,2) NOT NULL,
    "Interes" numeric(18,2) NOT NULL,
    "Multa" numeric(18,2) NOT NULL,
    "TotalPagado" numeric(18,2) NOT NULL,
    "SaldoRestante" numeric(18,2) NOT NULL,
    "FolioComprobante" text NOT NULL,
    "FechaPago" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_PagosPrestamo" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PagosPrestamo_Prestamos_PrestamoId" FOREIGN KEY ("PrestamoId") REFERENCES "Prestamos" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_PagosPrestamo_Usuarios_TesoreroId" FOREIGN KEY ("TesoreroId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT
);

INSERT INTO "Roles" ("Id", "Descripcion", "Nombre")
VALUES ('11111111-1111-1111-1111-111111111111', 'Administrador que crea cooperativas y configura reglas', 'GESTOR');
INSERT INTO "Roles" ("Id", "Descripcion", "Nombre")
VALUES ('22222222-2222-2222-2222-222222222222', 'Operador financiero que registra movimientos en bitácora', 'TESORERO');
INSERT INTO "Roles" ("Id", "Descripcion", "Nombre")
VALUES ('33333333-3333-3333-3333-333333333333', 'Usuario que consulta su historial, préstamos y comprobantes', 'SOCIO');

CREATE UNIQUE INDEX "IX_Aportaciones_PeriodoId_SocioId" ON "Aportaciones" ("PeriodoId", "SocioId");

CREATE INDEX "IX_Aportaciones_SocioId" ON "Aportaciones" ("SocioId");

CREATE INDEX "IX_Aportaciones_TesoreroId" ON "Aportaciones" ("TesoreroId");

CREATE INDEX "IX_Ciclos_CooperativaId" ON "Ciclos" ("CooperativaId");

CREATE UNIQUE INDEX "IX_ConfiguracionesAportacion_CooperativaId" ON "ConfiguracionesAportacion" ("CooperativaId");

CREATE UNIQUE INDEX "IX_ConfiguracionesPrestamo_CooperativaId" ON "ConfiguracionesPrestamo" ("CooperativaId");

CREATE UNIQUE INDEX "IX_ConfiguracionesRendimiento_CooperativaId" ON "ConfiguracionesRendimiento" ("CooperativaId");

CREATE UNIQUE INDEX "IX_Cooperativas_Codigo" ON "Cooperativas" ("Codigo");

CREATE INDEX "IX_Cooperativas_GestorId" ON "Cooperativas" ("GestorId");

CREATE INDEX "IX_Cooperativas_TesoreroId" ON "Cooperativas" ("TesoreroId");

CREATE UNIQUE INDEX "IX_DistribucionesCierre_CicloId_SocioId" ON "DistribucionesCierre" ("CicloId", "SocioId");

CREATE INDEX "IX_DistribucionesCierre_SocioId" ON "DistribucionesCierre" ("SocioId");

CREATE INDEX "IX_DistribucionesCierre_TesoreroEntregaId" ON "DistribucionesCierre" ("TesoreroEntregaId");

CREATE INDEX "IX_PagosPrestamo_PrestamoId" ON "PagosPrestamo" ("PrestamoId");

CREATE INDEX "IX_PagosPrestamo_TesoreroId" ON "PagosPrestamo" ("TesoreroId");

CREATE INDEX "IX_PeriodosAportacion_CicloId" ON "PeriodosAportacion" ("CicloId");

CREATE INDEX "IX_Prestamos_AvalId" ON "Prestamos" ("AvalId");

CREATE INDEX "IX_Prestamos_CicloId" ON "Prestamos" ("CicloId");

CREATE INDEX "IX_Prestamos_CooperativaId" ON "Prestamos" ("CooperativaId");

CREATE INDEX "IX_Prestamos_SocioId" ON "Prestamos" ("SocioId");

CREATE INDEX "IX_Prestamos_TesoreroId" ON "Prestamos" ("TesoreroId");

CREATE INDEX "IX_Usuarios_CooperativaId" ON "Usuarios" ("CooperativaId");

CREATE UNIQUE INDEX "IX_Usuarios_Correo" ON "Usuarios" ("Correo");

CREATE INDEX "IX_Usuarios_RolId" ON "Usuarios" ("RolId");

ALTER TABLE "Aportaciones" ADD CONSTRAINT "FK_Aportaciones_PeriodosAportacion_PeriodoId" FOREIGN KEY ("PeriodoId") REFERENCES "PeriodosAportacion" ("Id") ON DELETE CASCADE;

ALTER TABLE "Aportaciones" ADD CONSTRAINT "FK_Aportaciones_Usuarios_SocioId" FOREIGN KEY ("SocioId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT;

ALTER TABLE "Aportaciones" ADD CONSTRAINT "FK_Aportaciones_Usuarios_TesoreroId" FOREIGN KEY ("TesoreroId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT;

ALTER TABLE "Ciclos" ADD CONSTRAINT "FK_Ciclos_Cooperativas_CooperativaId" FOREIGN KEY ("CooperativaId") REFERENCES "Cooperativas" ("Id") ON DELETE CASCADE;

ALTER TABLE "ConfiguracionesAportacion" ADD CONSTRAINT "FK_ConfiguracionesAportacion_Cooperativas_CooperativaId" FOREIGN KEY ("CooperativaId") REFERENCES "Cooperativas" ("Id") ON DELETE CASCADE;

ALTER TABLE "ConfiguracionesPrestamo" ADD CONSTRAINT "FK_ConfiguracionesPrestamo_Cooperativas_CooperativaId" FOREIGN KEY ("CooperativaId") REFERENCES "Cooperativas" ("Id") ON DELETE CASCADE;

ALTER TABLE "ConfiguracionesRendimiento" ADD CONSTRAINT "FK_ConfiguracionesRendimiento_Cooperativas_CooperativaId" FOREIGN KEY ("CooperativaId") REFERENCES "Cooperativas" ("Id") ON DELETE CASCADE;

ALTER TABLE "Cooperativas" ADD CONSTRAINT "FK_Cooperativas_Usuarios_GestorId" FOREIGN KEY ("GestorId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT;

ALTER TABLE "Cooperativas" ADD CONSTRAINT "FK_Cooperativas_Usuarios_TesoreroId" FOREIGN KEY ("TesoreroId") REFERENCES "Usuarios" ("Id") ON DELETE SET NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260906201214_InitialCleanSchema', '8.0.32');

COMMIT;

START TRANSACTION;

INSERT INTO "Usuarios" ("Id", "ApellidoMaterno", "ApellidoPaterno", "ConsentimientoArco", "CooperativaId", "Correo", "Direccion", "Estatus", "FechaNacimiento", "FechaRegistro", "Nombres", "NumeroSocio", "PasswordHash", "RolId", "Telefono")
VALUES ('99999999-9999-9999-9999-999999999999', 'General', 'Gestor', TRUE, NULL, 'gestor@bancaetica.com', NULL, 'ACTIVO', NULL, TIMESTAMPTZ '2026-01-01T00:00:00Z', 'Administrador', NULL, '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '11111111-1111-1111-1111-111111111111', NULL);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260906203146_SeedGestorUser', '8.0.32');

COMMIT;

START TRANSACTION;

UPDATE "Usuarios" SET "PasswordHash" = '$2a$11$M4WBL8tqXQ/1folPRyw3rOhmWnbMxtu4gYmaM/fT2okU3ut6rVQKi'
WHERE "Id" = '99999999-9999-9999-9999-999999999999';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260909161725_ActualizarPasswordAdmin', '8.0.32');

COMMIT;

START TRANSACTION;

CREATE TABLE "Documentos" (
    "Id" uuid NOT NULL,
    "Tipo" character varying(100) NOT NULL,
    "Url" text NOT NULL,
    "SocioId" uuid NOT NULL,
    CONSTRAINT "PK_Documentos" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Documentos_Usuarios_SocioId" FOREIGN KEY ("SocioId") REFERENCES "Usuarios" ("Id") ON DELETE CASCADE
);

UPDATE "Usuarios" SET "PasswordHash" = '$2a$11$QFWxOOIT4/TEbO.duLgCsuhlAT8.xcvMnI3dKZ/1MXqJtDNaGCVN6'
WHERE "Id" = '99999999-9999-9999-9999-999999999999';

CREATE INDEX "IX_Documentos_SocioId" ON "Documentos" ("SocioId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260919053553_AgregarTablaDocumentos', '8.0.32');

COMMIT;

START TRANSACTION;

ALTER TABLE "Prestamos" ADD "SolicitudPrestamoId" uuid;

CREATE TABLE "SolicitudesPrestamos" (
    "Id" uuid NOT NULL,
    "UsuarioId" uuid NOT NULL,
    "CooperativaId" uuid NOT NULL,
    "CantidadSolicitada" numeric(18,2) NOT NULL,
    "NumeroContactoInmediato" character varying(25) NOT NULL,
    "Estatus" character varying(20) NOT NULL,
    "FechaSolicitud" timestamp with time zone NOT NULL,
    "FechaResolucion" timestamp with time zone,
    "PrestamoId" uuid,
    CONSTRAINT "PK_SolicitudesPrestamos" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SolicitudesPrestamos_Cooperativas_CooperativaId" FOREIGN KEY ("CooperativaId") REFERENCES "Cooperativas" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_SolicitudesPrestamos_Prestamos_PrestamoId" FOREIGN KEY ("PrestamoId") REFERENCES "Prestamos" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_SolicitudesPrestamos_Usuarios_UsuarioId" FOREIGN KEY ("UsuarioId") REFERENCES "Usuarios" ("Id") ON DELETE RESTRICT
);

UPDATE "Usuarios" SET "PasswordHash" = '$2a$11$UhE3LZmKJu/Mic5L5x4pdefzcAt4ltm4HSnyjVMuiQ9O39nSpmev2'
WHERE "Id" = '99999999-9999-9999-9999-999999999999';

CREATE INDEX "IX_SolicitudesPrestamos_CooperativaId" ON "SolicitudesPrestamos" ("CooperativaId");

CREATE UNIQUE INDEX "IX_SolicitudesPrestamos_PrestamoId" ON "SolicitudesPrestamos" ("PrestamoId");

CREATE INDEX "IX_SolicitudesPrestamos_UsuarioId" ON "SolicitudesPrestamos" ("UsuarioId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261005192816_AgregarTablaSolicitudesPrestamos', '8.0.32');

COMMIT;

START TRANSACTION;

ALTER TABLE "SolicitudesPrestamos" ADD "Descripcion" character varying(500);

UPDATE "Usuarios" SET "PasswordHash" = '$2a$11$G6/dpN1eAlw8KOLK/AQVHe7ucq9Ccaxg74oSr6vYAO4m2M9FR9E5u'
WHERE "Id" = '99999999-9999-9999-9999-999999999999';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261005194215_AgregarDescripcionASolicitudPrestamo', '8.0.32');

COMMIT;

START TRANSACTION;

ALTER TABLE "Cooperativas" ADD "ImagenUrl" character varying(500);

UPDATE "Usuarios" SET "PasswordHash" = '$2a$11$qZC2UrhLAvM0h57Vn0LfxeNEf3hEkpQVj6cm.aQXa4U5ThZNdxUx2'
WHERE "Id" = '99999999-9999-9999-9999-999999999999';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261017171532_AddImagenToCooperativa', '8.0.32');

COMMIT;


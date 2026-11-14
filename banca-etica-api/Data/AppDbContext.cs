using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using banca_etica_api.Models;

namespace banca_etica_api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Rol> Roles { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Cooperativa> Cooperativas { get; set; }
        public DbSet<ConfiguracionAportacion> ConfiguracionesAportacion { get; set; }
        public DbSet<ConfiguracionRendimiento> ConfiguracionesRendimiento { get; set; }
        public DbSet<ConfiguracionPrestamo> ConfiguracionesPrestamo { get; set; }
        public DbSet<Ciclo> Ciclos { get; set; }
        public DbSet<PeriodoAportacion> PeriodosAportacion { get; set; }
        public DbSet<Aportacion> Aportaciones { get; set; }
        public DbSet<Prestamo> Prestamos { get; set; }
        public DbSet<PagoPrestamo> PagosPrestamo { get; set; }
        public DbSet<DistribucionCierre> DistribucionesCierre { get; set; }
        public DbSet<Documento> Documentos { get; set; }
        public DbSet<SolicitudPrestamo> SolicitudesPrestamos { get; set; } // <-- Nuevo DbSet

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Estandarizar decimales a numeric(18,2)
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                         .SelectMany(t => t.GetProperties())
                         .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetColumnType("numeric(18,2)");
            }

            // 2. Unicidad de campos clave
            modelBuilder.Entity<Cooperativa>()
                .HasIndex(c => c.Codigo)
                .IsUnique();

            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Correo)
                .IsUnique();

            modelBuilder.Entity<Aportacion>()
                .HasIndex(a => new { a.PeriodoId, a.SocioId })
                .IsUnique();

            modelBuilder.Entity<DistribucionCierre>()
                .HasIndex(d => new { d.CicloId, d.SocioId })
                .IsUnique();

            // 3. Configuraciones 1:1 con Cooperativa
            modelBuilder.Entity<Cooperativa>()
                .HasOne(c => c.ConfigAportacion)
                .WithOne(ca => ca.Cooperativa)
                .HasForeignKey<ConfiguracionAportacion>(ca => ca.CooperativaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cooperativa>()
                .HasOne(c => c.ConfigRendimiento)
                .WithOne(cr => cr.Cooperativa)
                .HasForeignKey<ConfiguracionRendimiento>(cr => cr.CooperativaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cooperativa>()
                .HasOne(c => c.ConfigPrestamo)
                .WithOne(cp => cp.Cooperativa)
                .HasForeignKey<ConfiguracionPrestamo>(cp => cp.CooperativaId)
                .OnDelete(DeleteBehavior.Cascade);

            // 4. Relaciones de Cooperativa
            modelBuilder.Entity<Cooperativa>()
                .HasOne(c => c.Gestor)
                .WithMany()
                .HasForeignKey(c => c.GestorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cooperativa>()
                .HasOne(c => c.Tesorero)
                .WithMany()
                .HasForeignKey(c => c.TesoreroId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);
            
            modelBuilder.Entity<Cooperativa>(entity =>
            {
                entity.Property(c => c.ImagenUrl)
                      .HasMaxLength(500)
                      .IsRequired(false);
            });

            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Cooperativa)
                .WithMany(c => c.Socios)
                .HasForeignKey(u => u.CooperativaId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // 5. Relaciones de Aportación (desambiguadas)
            modelBuilder.Entity<Aportacion>()
                .HasOne(a => a.Socio)
                .WithMany()
                .HasForeignKey(a => a.SocioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Aportacion>()
                .HasOne(a => a.Tesorero)
                .WithMany(u => u.AportacionesRegistradas)
                .HasForeignKey(a => a.TesoreroId)
                .OnDelete(DeleteBehavior.Restrict);

            // 6. Relaciones de Préstamos
            modelBuilder.Entity<Prestamo>()
                .HasOne(p => p.Socio)
                .WithMany(u => u.PrestamosComoTitular)
                .HasForeignKey(p => p.SocioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Prestamo>()
                .HasOne(p => p.Aval)
                .WithMany(u => u.PrestamosComoAval)
                .HasForeignKey(p => p.AvalId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Prestamo>()
                .HasOne(p => p.Tesorero)
                .WithMany()
                .HasForeignKey(p => p.TesoreroId)
                .OnDelete(DeleteBehavior.Restrict);

            // 7. Relaciones de Pagos de Préstamo
            modelBuilder.Entity<PagoPrestamo>()
                .HasOne(pp => pp.Prestamo)
                .WithMany(p => p.Pagos)
                .HasForeignKey(pp => pp.PrestamoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PagoPrestamo>()
                .HasOne(pp => pp.Tesorero)
                .WithMany()
                .HasForeignKey(pp => pp.TesoreroId)
                .OnDelete(DeleteBehavior.Restrict);

            // 8. Relaciones de Distribuciones de Cierre
            modelBuilder.Entity<DistribucionCierre>()
                .HasOne(d => d.Socio)
                .WithMany(u => u.Distribuciones)
                .HasForeignKey(d => d.SocioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DistribucionCierre>()
                .HasOne(d => d.TesoreroEntrega)
                .WithMany()
                .HasForeignKey(d => d.TesoreroEntregaId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // 9. Relación de Documentos (Socio / Usuario)
            modelBuilder.Entity<Documento>(entity =>
            {
                entity.HasKey(d => d.Id);

                entity.Property(d => d.Tipo)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(d => d.Url)
                    .IsRequired();

                entity.HasOne(d => d.Socio)
                    .WithMany(u => u.Documentos)
                    .HasForeignKey(d => d.SocioId)
                    .OnDelete(DeleteBehavior.Cascade); // Si se borra el usuario, se borran sus documentos
            });

            // 10. Relación de Solicitudes de Préstamo
            modelBuilder.Entity<SolicitudPrestamo>(entity =>
            {
                entity.HasKey(s => s.Id);
            
                entity.Property(s => s.CantidadSolicitada)
                    .HasColumnType("numeric(18,2)")
                    .IsRequired();
            
                entity.Property(s => s.NumeroContactoInmediato)
                    .HasMaxLength(25)
                    .IsRequired();
            
                // NUEVO: Configuración de la columna Descripcion
                entity.Property(s => s.Descripcion)
                    .HasMaxLength(500)
                    .IsRequired(false);
            
                entity.Property(s => s.Estatus)
                    .HasMaxLength(20)
                    .IsRequired();
            
                // Relación con Usuario
                entity.HasOne(s => s.Usuario)
                    .WithMany(u => u.SolicitudesPrestamos)
                    .HasForeignKey(s => s.UsuarioId)
                    .OnDelete(DeleteBehavior.Restrict);
            
                // Relación con Cooperativa
                entity.HasOne(s => s.Cooperativa)
                    .WithMany(c => c.SolicitudesPrestamos)
                    .HasForeignKey(s => s.CooperativaId)
                    .OnDelete(DeleteBehavior.Restrict);
            
                // Relación con Prestamo
                entity.HasOne(s => s.Prestamo)
                    .WithOne(p => p.SolicitudPrestamo)
                    .HasForeignKey<SolicitudPrestamo>(s => s.PrestamoId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // 11. Seed de Roles
            var gestorRolId   = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var tesoreroRolId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var socioRolId    = Guid.Parse("33333333-3333-3333-3333-333333333333");

            modelBuilder.Entity<Rol>().HasData(
                new Rol { Id = gestorRolId,   Nombre = "GESTOR",   Descripcion = "Administrador que crea cooperativas y configura reglas" },
                new Rol { Id = tesoreroRolId, Nombre = "TESORERO", Descripcion = "Operador financiero que registra movimientos en bitácora" },
                new Rol { Id = socioRolId,    Nombre = "SOCIO",    Descripcion = "Usuario que consulta su historial, préstamos y comprobantes" }
            );

            // Seed de Usuario Gestor
            var gestorUsuarioId = Guid.Parse("99999999-9999-9999-9999-999999999999");

            // Hash BCrypt estable para la contraseña de desarrollo: "Admin123!".
            // No debe generarse en tiempo de ejecución porque EF detectaría un cambio en cada migración.
            const string hashCorrecto = "$2a$11$qZC2UrhLAvM0h57Vn0LfxeNEf3hEkpQVj6cm.aQXa4U5ThZNdxUx2";

            modelBuilder.Entity<Usuario>().HasData(
                new Usuario
                {
                    Id = gestorUsuarioId,
                    RolId = gestorRolId,
                    CooperativaId = null, // El gestor no pertenece a una sola cooperativa, las administra todas
                    Nombres = "Administrador",
                    ApellidoPaterno = "Gestor",
                    ApellidoMaterno = "General",
                    Correo = "gestor@bancaetica.com",
                    PasswordHash = hashCorrecto,
                    ConsentimientoArco = true,
                    Estatus = "ACTIVO",
                    FechaRegistro = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        }
    }
}

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

            // 9. Seed de Roles
            var gestorRolId   = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var tesoreroRolId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var socioRolId    = Guid.Parse("33333333-3333-3333-3333-333333333333");

            modelBuilder.Entity<Rol>().HasData(
                new Rol { Id = gestorRolId,   Nombre = "GESTOR",   Descripcion = "Administrador que crea cooperativas y configura reglas" },
                new Rol { Id = tesoreroRolId, Nombre = "TESORERO", Descripcion = "Operador financiero que registra movimientos en bitácora" },
                new Rol { Id = socioRolId,    Nombre = "SOCIO",    Descripcion = "Usuario que consulta su historial, préstamos y comprobantes" }
            );
        }
    }
}
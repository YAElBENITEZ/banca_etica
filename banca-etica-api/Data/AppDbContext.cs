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

        // 1. Identidad y Gobernanza
        public DbSet<Rol> Roles { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Comunidad> Comunidades { get; set; }
        public DbSet<ReglamentoUnion> Reglamentos { get; set; }
        public DbSet<ProgresoEducacion> ProgresosEducativos { get; set; }

        // 2. Ahorro Cooperativo
        public DbSet<Cajita> Cajitas { get; set; }
        public DbSet<HistorialCuadernillo> Historiales { get; set; }
        public DbSet<FondoUnion> Fondos { get; set; }
        public DbSet<Prestamo> Prestamos { get; set; }

        // 3. Producción y Billetera Diaria
        public DbSet<LoteProduccion> Lotes { get; set; }
        public DbSet<Transaccion> Transacciones { get; set; }

        // 4. Arquitectura Offline-First
        public DbSet<Sincronizacion> ColaSincronizacion { get; set; }

        // Tablas normalizadas
        public DbSet<TablaPagosPrestamo> TablaPagosPrestamos { get; set; }
        public DbSet<PrestamoAvalista> PrestamoAvalistas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Llave primaria compuesta para Avalistas
            modelBuilder.Entity<PrestamoAvalista>()
                .HasKey(pa => new { pa.PrestamoId, pa.AvalistaUsuarioId });

            // 2. Relaciones de Avalistas con Préstamo y Usuario
            modelBuilder.Entity<PrestamoAvalista>()
                .HasOne(pa => pa.Prestamo)
                .WithMany(p => p.Avalistas)
                .HasForeignKey(pa => pa.PrestamoId);

            modelBuilder.Entity<PrestamoAvalista>()
                .HasOne(pa => pa.AvalistaUsuario)
                .WithMany()
                .HasForeignKey(pa => pa.AvalistaUsuarioId);

            // 3. Estandarización de columnas decimal a numeric(18,2)
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                         .SelectMany(t => t.GetProperties())
                         .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetColumnType("numeric(18,2)");
            }

            // 4. Precargar (Seed) los Roles principales del sistema con IDs fijos
            var superAdminRolId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var adminRolId      = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var socioRolId      = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var tesoreroRolId   = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var consejoRolId    = Guid.Parse("44444444-4444-4444-4444-444444444444");
            
            modelBuilder.Entity<Rol>().HasData(
                new Rol { Id = superAdminRolId, Nombre = "SuperAdmin", Descripcion = "Superadministrador global del sistema y gestión de comunidades" },
                new Rol { Id = adminRolId,      Nombre = "Admin",      Descripcion = "Administrador de la comunidad" },
                new Rol { Id = socioRolId,      Nombre = "Socio",      Descripcion = "Productor artesanal / agricultor" },
                new Rol { Id = tesoreroRolId,   Nombre = "Tesorero",   Descripcion = "Encargado de gestionar la caja comunal" },
                new Rol { Id = consejoRolId,    Nombre = "Consejo",    Descripcion = "Miembro del comité de administración o vigilancia" }
            );

            // 5. Relación Usuario -> Rol
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Rol)
                .WithMany(r => r.Usuarios)
                .HasForeignKey(u => u.RolId)
                .OnDelete(DeleteBehavior.Restrict);

            // 6. Relación Usuario -> Cajitas (1:N)
            modelBuilder.Entity<Cajita>()
                .HasOne(c => c.Usuario)
                .WithMany(u => u.Cajitas)
                .HasForeignKey(c => c.UsuarioId);

            // 7. Relación Usuario -> Comunidad (Opcional, 1:N)
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Comunidad)
                .WithMany(c => c.Usuarios)
                .HasForeignKey(u => u.ComunidadId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
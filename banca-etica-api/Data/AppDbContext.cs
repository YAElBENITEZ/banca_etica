using Microsoft.EntityFrameworkCore;
using System.Linq; // <-- ¡NUEVO! Es indispensable para que funcione el buscador de decimales
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

        // Nuevas tablas normalizadas
        public DbSet<TablaPagosPrestamo> TablaPagosPrestamos { get; set; }
        public DbSet<PrestamoAvalista> PrestamoAvalistas { get; set; }

        // ==========================================
        // ¡AQUÍ ESTÁ EL MÉTODO QUE HACÍA FALTA!
        // ==========================================
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Regla de oro: Siempre llamamos a la base primero para conservar la configuración por defecto
            base.OnModelCreating(modelBuilder);

            // 1. Configuramos la llave primaria compuesta para la tabla intermedia de Avalistas
            modelBuilder.Entity<PrestamoAvalista>()
                .HasKey(pa => new { pa.PrestamoId, pa.AvalistaUsuarioId });

            // 2. Le explicamos a EF Core cómo se conectan los Avalistas con los Préstamos y Usuarios
            modelBuilder.Entity<PrestamoAvalista>()
                .HasOne(pa => pa.Prestamo)
                .WithMany(p => p.Avalistas)
                .HasForeignKey(pa => pa.PrestamoId);

            modelBuilder.Entity<PrestamoAvalista>()
                .HasOne(pa => pa.AvalistaUsuario)
                .WithMany()
                .HasForeignKey(pa => pa.AvalistaUsuarioId);

            // 3. Automatización: Buscamos CUALQUIER propiedad tipo 'decimal' en todos tus modelos 
            // y la configuramos como 'numeric(18,2)' para cuidar los centavos de la cooperativa.
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                         .SelectMany(t => t.GetProperties())
                         .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetColumnType("numeric(18,2)");
            }

            // 4. Precargar (Seed) los Roles principales del sistema con IDs fijos
            var adminRolId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var socioRolId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var tesoreroRolId = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var consejoRolId = Guid.Parse("44444444-4444-4444-4444-444444444444");
            
            modelBuilder.Entity<Rol>().HasData(
                new Rol { Id = adminRolId, Nombre = "Admin", Descripcion = "Administrador total del sistema" },
                new Rol { Id = socioRolId, Nombre = "Socio", Descripcion = "Productor artesanal / agricultor" },
                new Rol { Id = tesoreroRolId, Nombre = "Tesorero", Descripcion = "Encargado de gestionar la caja comunal" },
                new Rol { Id = consejoRolId, Nombre = "Consejo", Descripcion = "Miembro del comité de administración o vigilancia" }
            );
            
            // 5. Configurar la relación explícita de Usuario -> Rol
            /*modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Rol)
                .WithMany(r => r.Usuarios)
                .HasForeignKey(u => u.RolId)
                .OnDelete(DeleteBehavior.Restrict); // Evita borrar un rol si tiene usuarios activos*/
            // 5. Configurar la relación explícita de Usuario -> Rol
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Rol)
                .WithMany(r => r.Usuarios)
                .HasForeignKey(u => u.RolId)
                .OnDelete(DeleteBehavior.Restrict); // Evita borrar un rol si tiene usuarios activos
                
            // ==========================================
            // NUEVO: 6. Configurar la relación 1:N de Usuario -> Cajitas
            // ==========================================
            modelBuilder.Entity<Cajita>()
                .HasOne(c => c.Usuario)       // Una cajita tiene un dueño
                .WithMany(u => u.Cajitas)     // Un dueño puede tener MUCHAS cajitas
                .HasForeignKey(c => c.UsuarioId);
            // Fin de OnModelCreating
        }
    }
}
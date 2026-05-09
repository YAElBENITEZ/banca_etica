using Microsoft.EntityFrameworkCore;
using banca_etica_api.Models; // Asegúrate de importar la carpeta de tus modelos

namespace banca_etica_api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // 1. Identidad y Gobernanza
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
    }
}
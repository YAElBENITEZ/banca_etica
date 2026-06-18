using System;

namespace banca_etica_api.Models
{
    public class TablaPagosPrestamo
    {
        public Guid Id { get; set; }
        public Guid PrestamoId { get; set; }
        public int NumeroParcialidad { get; set; }
        public DateTimeOffset FechaVencimiento { get; set; }
        public decimal MontoPrincipal { get; set; }
        public decimal MontoInteres { get; set; }
        public decimal MontoPagado { get; set; }
        public string Estado { get; set; } // "Pendiente", "Pagado", "Vencido"

        // Propiedad de navegación de regreso al préstamo
        public virtual Prestamo Prestamo { get; set; }
    }
}
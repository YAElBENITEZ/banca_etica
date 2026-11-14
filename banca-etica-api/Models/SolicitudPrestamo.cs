using System;

namespace banca_etica_api.Models
{
    public class SolicitudPrestamo
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UsuarioId { get; set; }
        public Guid CooperativaId { get; set; }
        public decimal CantidadSolicitada { get; set; }
        public string NumeroContactoInmediato { get; set; } = string.Empty;
        
        // NUEVO: Motivo o descripción de la emergencia
        public string? Descripcion { get; set; }

        public string Estatus { get; set; } = "PENDIENTE"; // PENDIENTE, APROBADA, RECHAZADA
        public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;
        public DateTime? FechaResolucion { get; set; }

        // Si se aprueba, se conecta al préstamo creado
        public Guid? PrestamoId { get; set; }

        // Propiedades de navegación
        public virtual Usuario Usuario { get; set; } = null!;
        public virtual Cooperativa Cooperativa { get; set; } = null!;
        public virtual Prestamo? Prestamo { get; set; }
    }
}
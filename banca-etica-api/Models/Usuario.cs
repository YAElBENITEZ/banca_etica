using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Usuario
    {
        // Llave primaria
        public Guid Id { get; set; }

        // Perfil Básico
        public string NombreCompleto { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        // Seguridad y Gobernanza
        public Guid RolId { get; set; }
        public virtual Rol Rol { get; set; } = null!;
        public string EstatusMembresia { get; set; } = "Activo"; // "Activo", "Suspendido", "Baja Voluntaria"

        // Comunidad (Opcional para Superadmin y Admins globales)
        public Guid? ComunidadId { get; set; }
        public virtual Comunidad? Comunidad { get; set; }

        // Configuraciones y Legales
        public bool ConsentimientosArco { get; set; }
        public decimal UmbralAlertaSaldo { get; set; }
        public DateTime FechaAfiliacion { get; set; } = DateTime.UtcNow;

        // Relaciones 1 a 1
        public virtual ProgresoEducacion? ProgresoEducativo { get; set; }

        // Relaciones 1 a N
        public virtual ICollection<Cajita> Cajitas { get; set; } = new List<Cajita>();
        public virtual ICollection<LoteProduccion> Lotes { get; set; } = new List<LoteProduccion>();
        public virtual ICollection<Transaccion> Transacciones { get; set; } = new List<Transaccion>();
    }
}
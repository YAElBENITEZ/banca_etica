using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Usuario
    {
        // Llave primaria
        public Guid Id { get; set; }

        // Perfil Básico
        public string NombreCompleto { get; set; }
        public string Telefono { get; set; }
        public string Correo { get; set; } 
        public string PasswordHash { get; set; }
        
        // Seguridad y Gobernanza
        // Seguridad y Gobernanza (¡Ajustado!)
        public Guid RolId { get; set; } // Esta es la llave foránea física en la base de datos
        public virtual Rol Rol { get; set; } // Propiedad de navegación para acceder a los datos del rol
        public string EstatusMembresia { get; set; } // "Activo", "Suspendido", "Baja Voluntaria"
        
        // Configuraciones y Legales
        public bool ConsentimientosArco { get; set; }
        public decimal UmbralAlertaSaldo { get; set; } // Límite para notificaciones
        public DateTime FechaAfiliacion { get; set; }

        // Relaciones (Navigation Properties para EF Core)
        // 1 a 1: Un usuario tiene exactamente una cajita y un progreso educativo
        public ICollection<Cajita> Cajitas { get; set; }
        public ProgresoEducacion ProgresoEducativo { get; set; }

        // 1 a N: Un usuario puede tener muchos lotes y transacciones
        public ICollection<LoteProduccion> Lotes { get; set; }
        public ICollection<Transaccion> Transacciones { get; set; }
    }
}
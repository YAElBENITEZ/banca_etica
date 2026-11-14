using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Usuario
    {
        public Guid Id { get; set; }
        public Guid RolId { get; set; }
        public Guid? CooperativaId { get; set; }
        public string? NumeroSocio { get; set; }
        public string Nombres { get; set; } = string.Empty;
        public string ApellidoPaterno { get; set; } = string.Empty;
        public string? ApellidoMaterno { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string? Telefono { get; set; }
        public string? Celular { get; set; }
        public string? Direccion { get; set; }
        public string? Curp { get; set; }
        public string? Rfc { get; set; }
        public string? NombreBeneficiario { get; set; }
        public string? TipoSocio { get; set; }
        public string Correo { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool ConsentimientoArco { get; set; } = false;
        public string Estatus { get; set; } = "ACTIVO";
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

        // Propiedades de navegación
        public virtual Rol Rol { get; set; } = null!;
        public virtual Cooperativa? Cooperativa { get; set; }

        public virtual ICollection<Aportacion> AportacionesRegistradas { get; set; } = new List<Aportacion>();
        public virtual ICollection<Prestamo> PrestamosComoTitular { get; set; } = new List<Prestamo>();
        public virtual ICollection<Prestamo> PrestamosComoAval { get; set; } = new List<Prestamo>();
        public virtual ICollection<DistribucionCierre> Distribuciones { get; set; } = new List<DistribucionCierre>();
        public virtual ICollection<Documento> Documentos { get; set; } = new List<Documento>();

        // NUEVO: Solicitudes de préstamos realizadas por el usuario
        public virtual ICollection<SolicitudPrestamo> SolicitudesPrestamos { get; set; } = new List<SolicitudPrestamo>();
    }
}

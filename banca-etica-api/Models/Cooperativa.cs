using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Cooperativa
    {
        public Guid Id { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? ImagenUrl { get; set; }
        public string? Ciudad { get; set; }
        public string? Estado { get; set; }
        public Guid GestorId { get; set; }
        public Guid? TesoreroId { get; set; }
        public string Estatus { get; set; } = "ACTIVA";
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public virtual Usuario Gestor { get; set; } = null!;
        public virtual Usuario? Tesorero { get; set; }

        public virtual ConfiguracionAportacion? ConfigAportacion { get; set; }
        public virtual ConfiguracionRendimiento? ConfigRendimiento { get; set; }
        public virtual ConfiguracionPrestamo? ConfigPrestamo { get; set; }

        public virtual ICollection<Usuario> Socios { get; set; } = new List<Usuario>();
        public virtual ICollection<Ciclo> Ciclos { get; set; } = new List<Ciclo>();
        public virtual ICollection<Prestamo> Prestamos { get; set; } = new List<Prestamo>();

        public virtual ICollection<SolicitudPrestamo> SolicitudesPrestamos { get; set; } = new List<SolicitudPrestamo>();
    }
}
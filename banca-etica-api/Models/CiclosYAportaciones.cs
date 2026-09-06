using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Ciclo
    {
        public Guid Id { get; set; }
        public Guid CooperativaId { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int DuracionMeses { get; set; }
        public string Estatus { get; set; } = "ACTIVO"; // ACTIVO, FINALIZADO
        public DateTime? FechaCierre { get; set; }

        public virtual Cooperativa Cooperativa { get; set; } = null!;
        public virtual ICollection<PeriodoAportacion> Periodos { get; set; } = new List<PeriodoAportacion>();
        public virtual ICollection<Prestamo> Prestamos { get; set; } = new List<Prestamo>();
        public virtual ICollection<DistribucionCierre> Distribuciones { get; set; } = new List<DistribucionCierre>();
    }

    public class PeriodoAportacion
    {
        public Guid Id { get; set; }
        public Guid CicloId { get; set; }
        public int NumeroPeriodo { get; set; }
        public string NombrePeriodo { get; set; } = string.Empty; // 'Enero 2026', 'Semana 1'
        public DateTime? FechaCorte { get; set; }

        public virtual Ciclo Ciclo { get; set; } = null!;
        public virtual ICollection<Aportacion> Aportaciones { get; set; } = new List<Aportacion>();
    }

    public class Aportacion
    {
        public Guid Id { get; set; }
        public Guid PeriodoId { get; set; }
        public Guid SocioId { get; set; }
        public Guid TesoreroId { get; set; }
        public decimal Monto { get; set; }
        public string FolioComprobante { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

        public virtual PeriodoAportacion Periodo { get; set; } = null!;
        public virtual Usuario Socio { get; set; } = null!;
        public virtual Usuario Tesorero { get; set; } = null!;
    }
}
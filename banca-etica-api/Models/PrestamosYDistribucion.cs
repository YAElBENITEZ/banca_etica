using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Prestamo
    {
        public Guid Id { get; set; }
        public Guid CooperativaId { get; set; }
        public Guid CicloId { get; set; }
        public Guid SocioId { get; set; }
        public Guid? AvalId { get; set; }
        public Guid TesoreroId { get; set; }
        public decimal MontoOriginal { get; set; }
        public decimal TasaInteres { get; set; }
        public int Plazo { get; set; }
        public decimal SaldoPendiente { get; set; }
        public string Estatus { get; set; } = "ACTIVO"; // ACTIVO, LIQUIDADO
        public DateTime FechaOtorgamiento { get; set; }
        public string FolioComprobante { get; set; } = string.Empty;

        public virtual Cooperativa Cooperativa { get; set; } = null!;
        public virtual Ciclo Ciclo { get; set; } = null!;
        public virtual Usuario Socio { get; set; } = null!;
        public virtual Usuario? Aval { get; set; }
        public virtual Usuario Tesorero { get; set; } = null!;

        public virtual ICollection<PagoPrestamo> Pagos { get; set; } = new List<PagoPrestamo>();
    }

    public class PagoPrestamo
    {
        public Guid Id { get; set; }
        public Guid PrestamoId { get; set; }
        public Guid TesoreroId { get; set; }
        public string TipoPago { get; set; } = "NORMAL"; // NORMAL, MOROSO
        public decimal MontoBase { get; set; }
        public decimal Interes { get; set; } = 0.00m;
        public decimal Multa { get; set; } = 0.00m;
        public decimal TotalPagado { get; set; }
        public decimal SaldoRestante { get; set; }
        public string FolioComprobante { get; set; } = string.Empty;
        public DateTime FechaPago { get; set; } = DateTime.UtcNow;

        public virtual Prestamo Prestamo { get; set; } = null!;
        public virtual Usuario Tesorero { get; set; } = null!;
    }

    public class DistribucionCierre
    {
        public Guid Id { get; set; }
        public Guid CicloId { get; set; }
        public Guid SocioId { get; set; }
        public decimal TotalAportado { get; set; }
        public decimal RendimientosGenerados { get; set; } = 0.00m;
        public decimal DeduccionesPrestamos { get; set; } = 0.00m;
        public decimal TotalAEntregar { get; set; }
        public string Estatus { get; set; } = "PENDIENTE"; // PENDIENTE, PAGADO
        public Guid? TesoreroEntregaId { get; set; }
        public DateTime? FechaEntrega { get; set; }
        public string? FolioComprobante { get; set; }

        public virtual Ciclo Ciclo { get; set; } = null!;
        public virtual Usuario Socio { get; set; } = null!;
        public virtual Usuario? TesoreroEntrega { get; set; }
    }
}
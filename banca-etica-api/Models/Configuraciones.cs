using System;

namespace banca_etica_api.Models
{
    public class ConfiguracionAportacion
    {
        public Guid Id { get; set; }
        public Guid CooperativaId { get; set; }
        public bool ManejaAportaciones { get; set; } = true;
        public string Periodicidad { get; set; } = string.Empty; // SEMANAL_52, QUINCENAL_24, MENSUAL_12
        public decimal MontoMinimo { get; set; }
        public decimal MontoMaximo { get; set; }
        public string TipoMonto { get; set; } = string.Empty; // FIJO, VARIABLE

        public virtual Cooperativa Cooperativa { get; set; } = null!;
    }

    public class ConfiguracionRendimiento
    {
        public Guid Id { get; set; }
        public Guid CooperativaId { get; set; }
        public bool GeneraRendimientos { get; set; } = false;
        public decimal? Porcentaje { get; set; }
        public string? PeriodicidadCalculo { get; set; }
        public string? FormaDistribucion { get; set; }

        public virtual Cooperativa Cooperativa { get; set; } = null!;
    }

    public class ConfiguracionPrestamo
    {
        public Guid Id { get; set; }
        public Guid CooperativaId { get; set; }
        public bool ManejaPrestamos { get; set; } = false;
        public decimal? MontoMinimo { get; set; }
        public decimal? MontoMaximo { get; set; }
        public decimal? FactorMaximo { get; set; }
        public decimal? TasaInteres { get; set; }
        public string? PeriodoInteres { get; set; }
        public string? FrecuenciaPago { get; set; }
        public int? PlazoMaximoMeses { get; set; }
        public bool RequiereAval { get; set; } = false;
        public decimal? MultaMoroso { get; set; }

        public virtual Cooperativa Cooperativa { get; set; } = null!;
    }
}
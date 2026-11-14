using System.ComponentModel.DataAnnotations;

namespace banca_etica_api.DTOs;

public sealed class ConfiguracionRequest
{
    public bool ManejaAportaciones { get; init; }
    public string? PeriodicidadAportacion { get; init; }
    public decimal MontoMinimoAportacion { get; init; }
    public decimal MontoMaximoAportacion { get; init; }
    public bool MontoAportacionFijo { get; init; }

    public bool GeneraRendimientos { get; init; }
    public decimal PorcentajeRendimiento { get; init; }
    public string? PeriodicidadRendimiento { get; init; }
    public string? DistribucionRendimiento { get; init; }

    public bool ManejaPrestamos { get; init; }
    public decimal MontoMinimoPrestamo { get; init; }
    public decimal MontoMaximoPrestamo { get; init; }
    public decimal FactorMaximoPrestamo { get; init; }
    public decimal TasaInteres { get; init; }
    public string? PeriodoInteres { get; init; }
    public string? FrecuenciaPago { get; init; }
    public int PlazoMaximoMeses { get; init; }
    public decimal MultaMorosidad { get; init; }

    public DateTime? InicioCiclo { get; init; }
    public DateTime? FinCiclo { get; init; }
    public int DuracionCicloMeses { get; init; }
}
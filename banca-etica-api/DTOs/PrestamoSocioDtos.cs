using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace banca_etica_api.DTOs;

public class SolicitudEmergenciaRequest
{
    [Required(ErrorMessage = "El monto es obligatorio.")]
    [Range(1, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0.")]
    public decimal Monto { get; set; }

    [Required(ErrorMessage = "El número de contacto es obligatorio.")]
    [MaxLength(25, ErrorMessage = "El número de contacto no debe superar los 25 caracteres.")]
    public string NumeroContacto { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "La descripción no debe exceder los 500 caracteres.")]
    public string? Descripcion { get; set; }
}

public class PrestamoSocioResponse
{
    public Guid Id { get; set; }
    public string Proposito { get; set; } = string.Empty;
    public decimal MontoOriginal { get; set; }
    public decimal Tasa { get; set; }
    public int PlazoMeses { get; set; }
    public string TipoInteres { get; set; } = "Simple Mensual";
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaDesembolso { get; set; }
    public string CajitaNombre { get; set; } = string.Empty;
    public decimal SaldoPendiente { get; set; }
    public List<PagoPrestamoSocioResponse> Pagos { get; set; } = new();
}

public class PagoPrestamoSocioResponse
{
    public int Numero { get; set; }
    public DateTime Vencimiento { get; set; }
    public decimal Capital { get; set; }
    public decimal Interes { get; set; }
    public decimal MontoPagado { get; set; }
    public decimal Multa { get; set; }
    public string TipoPago { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using banca_etica_api.Data;
using banca_etica_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Tesorero;

[ApiController]
[Authorize(Roles = "Tesorero")]
[Route("api/tesorero/prestamos")]
public class PrestamosController : ControllerBase
{
    private readonly AppDbContext _context;
    public PrestamosController(AppDbContext context) => _context = context;

    [HttpGet("socios")]
    public async Task<IActionResult> Socios() => Ok(await _context.Usuarios.Include(u => u.Rol)
        .Where(u => u.CooperativaId == CooperativaId() && u.Estatus == "ACTIVO" && u.Rol.Nombre == "SOCIO")
        .OrderBy(u => u.Nombres)
        .Select(u => new { id = u.Id, nombre = (u.Nombres + " " + u.ApellidoPaterno + " " + (u.ApellidoMaterno ?? "")).Trim() })
        .ToListAsync());

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var prestamos = await PrestamosDeCooperativa()
            .Include(p => p.Socio)
            .OrderByDescending(p => p.FechaOtorgamiento)
            .ToListAsync();

        return Ok(prestamos.Select(p => Resumen(p)));
    }

    // NUEVO: Consultar solicitudes de emergencia de la cooperativa
    [HttpGet("solicitudes")]
    public async Task<IActionResult> ListarSolicitudes()
    {
        var solicitudes = await _context.SolicitudesPrestamos
            .AsNoTracking()
            .Include(s => s.Usuario)
            .Where(s => s.CooperativaId == CooperativaId())
            .OrderByDescending(s => s.FechaSolicitud)
            .Select(s => new
            {
                id = s.Id,
                socioId = s.UsuarioId,
                socio = (s.Usuario.Nombres + " " + s.Usuario.ApellidoPaterno + " " + (s.Usuario.ApellidoMaterno ?? "")).Trim(),
                numeroSocio = s.Usuario.NumeroSocio,
                monto = s.CantidadSolicitada,
                contacto = s.NumeroContactoInmediato,
                descripcion = s.Descripcion ?? "Sin descripción",
                estatus = s.Estatus,
                fechaSolicitud = s.FechaSolicitud,
                fechaResolucion = s.FechaResolucion
            })
            .ToListAsync();

        return Ok(solicitudes);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearPrestamoRequest request)
    {
        if (request.SocioId == Guid.Empty || request.Monto <= 0 || request.PlazoMeses <= 0 || !request.FechaDesembolso.HasValue)
            return BadRequest(new { mensaje = "Socio, monto, plazo y fecha de desembolso son obligatorios." });

        var config = await _context.ConfiguracionesPrestamo.SingleAsync(c => c.CooperativaId == CooperativaId());
        if (!config.ManejaPrestamos) return BadRequest(new { mensaje = "La cooperativa no tiene habilitados los préstamos." });
        if (request.Monto < (config.MontoMinimo ?? 0m) || (config.MontoMaximo.HasValue && request.Monto > config.MontoMaximo.Value))
            return BadRequest(new { mensaje = "El monto solicitado está fuera de los límites configurados." });
        if (config.PlazoMaximoMeses.HasValue && request.PlazoMeses > config.PlazoMaximoMeses.Value)
            return BadRequest(new { mensaje = "El plazo excede el máximo configurado." });

        var socio = await _context.Usuarios.Include(u => u.Rol)
            .SingleOrDefaultAsync(u => u.Id == request.SocioId && u.CooperativaId == CooperativaId() && u.Rol.Nombre == "SOCIO" && u.Estatus == "ACTIVO");
        if (socio is null) return BadRequest(new { mensaje = "El socio no pertenece a tu cooperativa." });

        var ciclo = await _context.Ciclos.FirstOrDefaultAsync(c => c.CooperativaId == CooperativaId() && c.Estatus == "ACTIVO");
        if (ciclo is null) return BadRequest(new { mensaje = "La cooperativa no tiene un ciclo activo." });

        var fecha = DateTime.SpecifyKind(request.FechaDesembolso.Value.Date, DateTimeKind.Utc);
        var prestamoId = Guid.NewGuid();

        var prestamo = new Prestamo
        {
            Id = prestamoId,
            CooperativaId = CooperativaId(),
            CicloId = ciclo.Id,
            SocioId = socio.Id,
            TesoreroId = UsuarioId(),
            MontoOriginal = request.Monto,
            TasaInteres = config.TasaInteres ?? 0m,
            Plazo = request.PlazoMeses,
            SaldoPendiente = CalcularTotalFinanciado(request.Monto, config.TasaInteres ?? 0m, request.PlazoMeses),
            Estatus = "ACTIVO",
            FechaOtorgamiento = fecha,
            FolioComprobante = $"PRE-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..5].ToUpperInvariant()}"
        };

        // Si este préstamo surge de una solicitud de emergencia aprobada
        if (request.SolicitudId.HasValue)
        {
            var solicitud = await _context.SolicitudesPrestamos
                .FirstOrDefaultAsync(s => s.Id == request.SolicitudId.Value && s.CooperativaId == CooperativaId());

            if (solicitud != null)
            {
                solicitud.Estatus = "APROBADA";
                solicitud.FechaResolucion = DateTime.UtcNow;
                solicitud.PrestamoId = prestamoId;
                prestamo.SolicitudPrestamoId = solicitud.Id;
            }
        }

        _context.Prestamos.Add(prestamo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Detalle), new { id = prestamo.Id }, new { id = prestamo.Id, mensaje = "Préstamo registrado correctamente." });
    }

    // NUEVO: Rechazar una solicitud
    [HttpPatch("solicitudes/{id:guid}/rechazar")]
    public async Task<IActionResult> RechazarSolicitud(Guid id)
    {
        var solicitud = await _context.SolicitudesPrestamos
            .FirstOrDefaultAsync(s => s.Id == id && s.CooperativaId == CooperativaId());

        if (solicitud == null)
            return NotFound(new { mensaje = "Solicitud no encontrada." });

        if (solicitud.Estatus != "PENDIENTE")
            return BadRequest(new { mensaje = "Solo se pueden rechazar solicitudes en estatus pendiente." });

        solicitud.Estatus = "RECHAZADA";
        solicitud.FechaResolucion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Solicitud rechazada correctamente." });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detalle(Guid id)
    {
        var prestamo = await PrestamosDeCooperativa().Include(p => p.Socio).Include(p => p.Pagos).SingleOrDefaultAsync(p => p.Id == id);
        if (prestamo is null) return NotFound(new { mensaje = "Préstamo no encontrado." });
        var config = await _context.ConfiguracionesPrestamo.SingleAsync(c => c.CooperativaId == CooperativaId());
        return Ok(new { id = prestamo.Id, socio = (prestamo.Socio.Nombres + " " + prestamo.Socio.ApellidoPaterno).Trim(), montoOriginal = prestamo.MontoOriginal, tasa = prestamo.TasaInteres, plazoMeses = prestamo.Plazo, estado = Estado(prestamo), pagos = Calendario(prestamo, config.MultaMoroso ?? 0m) });
    }

    [HttpPost("pagos")]
    public async Task<IActionResult> Pagar(RegistrarPagoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ParcialidadId) || !TryLeerParcialidad(request.ParcialidadId, out var prestamoId, out var numero))
            return BadRequest(new { mensaje = "La parcialidad seleccionada no es válida." });

        var prestamo = await PrestamosDeCooperativa().Include(p => p.Pagos).SingleOrDefaultAsync(p => p.Id == prestamoId);
        if (prestamo is null) return NotFound(new { mensaje = "Préstamo no encontrado." });

        var pagados = prestamo.Pagos.Count;
        if (numero != pagados + 1 || numero > prestamo.Plazo) return BadRequest(new { mensaje = "Solo puedes cobrar la siguiente parcialidad pendiente." });

        var config = await _context.ConfiguracionesPrestamo.SingleAsync(c => c.CooperativaId == CooperativaId());
        var capital = Decimal.Round(prestamo.MontoOriginal / prestamo.Plazo, 2, MidpointRounding.AwayFromZero);
        var interes = Decimal.Round((CalcularTotalFinanciado(prestamo.MontoOriginal, prestamo.TasaInteres, prestamo.Plazo) - prestamo.MontoOriginal) / prestamo.Plazo, 2, MidpointRounding.AwayFromZero);
        var basePago = capital + interes;
        var esMoroso = string.Equals(request.TipoPago, "Moroso", StringComparison.OrdinalIgnoreCase);
        var multa = esMoroso ? Decimal.Round(basePago * (config.MultaMoroso ?? 0m) / 100m, 2, MidpointRounding.AwayFromZero) : 0m;
        var total = basePago + multa;

        prestamo.SaldoPendiente = Math.Max(0m, prestamo.SaldoPendiente - basePago);
        if (prestamo.SaldoPendiente == 0m) prestamo.Estatus = "LIQUIDADO";

        _context.PagosPrestamo.Add(new PagoPrestamo
        {
            Id = Guid.NewGuid(),
            PrestamoId = prestamo.Id,
            TesoreroId = UsuarioId(),
            TipoPago = esMoroso ? "MOROSO" : "NORMAL",
            MontoBase = capital,
            Interes = interes,
            Multa = multa,
            TotalPagado = total,
            SaldoRestante = prestamo.SaldoPendiente,
            FolioComprobante = $"PAG-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..5].ToUpperInvariant()}",
            FechaPago = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { monto = total, multa, mensaje = "Pago registrado correctamente." });
    }

    private IQueryable<Prestamo> PrestamosDeCooperativa() => _context.Prestamos.Where(p => p.CooperativaId == CooperativaId());
    private Guid UsuarioId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private Guid CooperativaId() => Guid.Parse(User.FindFirstValue("cooperativaId")!);
    private static decimal CalcularTotalFinanciado(decimal monto, decimal tasa, int plazo) => Decimal.Round(monto + (monto * tasa / 100m * plazo), 2, MidpointRounding.AwayFromZero);
    private static string Estado(Prestamo prestamo) => prestamo.Estatus == "LIQUIDADO" ? "Liquidado" : "Activo";
    private static object Resumen(Prestamo p) => new { id = p.Id, socio = (p.Socio.Nombres + " " + p.Socio.ApellidoPaterno).Trim(), nombre = !string.IsNullOrWhiteSpace(p.FolioComprobante) ? p.FolioComprobante : "Préstamo registrado", montoOriginal = p.MontoOriginal, tasa = p.TasaInteres, plazoMeses = p.Plazo, fechaDesembolso = p.FechaOtorgamiento, estado = Estado(p), saldoPendiente = p.SaldoPendiente };
    
    private static IEnumerable<object> Calendario(Prestamo p, decimal multaPorcentaje)
    {
        var totalInteres = CalcularTotalFinanciado(p.MontoOriginal, p.TasaInteres, p.Plazo) - p.MontoOriginal;
        var capital = Decimal.Round(p.MontoOriginal / p.Plazo, 2, MidpointRounding.AwayFromZero);
        var interes = Decimal.Round(totalInteres / p.Plazo, 2, MidpointRounding.AwayFromZero);
        var pagos = p.Pagos.OrderBy(x => x.FechaPago).ToList();
        return Enumerable.Range(1, p.Plazo).Select(numero =>
        {
            var pago = pagos.ElementAtOrDefault(numero - 1);
            var vencimiento = p.FechaOtorgamiento.AddMonths(numero);
            return new { id = $"{p.Id:N}:{numero}", numero, vencimiento, capital, interes, multa = pago?.Multa ?? Decimal.Round((capital + interes) * multaPorcentaje / 100m, 2), montoPagado = pago?.TotalPagado, tipoPago = pago?.TipoPago == "MOROSO" ? "Moroso" : "Normal", fechaPago = pago?.FechaPago, estado = pago is null ? "Pendiente" : "Pagado" };
        });
    }

    private static bool TryLeerParcialidad(string valor, out Guid prestamoId, out int numero)
    {
        prestamoId = Guid.Empty;
        numero = 0;
        var partes = valor.Split(':');
        return partes.Length == 2 && Guid.TryParseExact(partes[0], "N", out prestamoId) && int.TryParse(partes[1], out numero);
    }
}

public sealed class CrearPrestamoRequest 
{ 
    public Guid SocioId { get; init; } 
    public string? Nombre { get; init; } 
    public decimal Monto { get; init; } 
    public int PlazoMeses { get; init; } 
    public DateTime? FechaDesembolso { get; init; } 
    public Guid? SolicitudId { get; init; } // <-- Opcional: Para aprobar una solicitud de emergencia
}

public sealed class RegistrarPagoRequest 
{ 
    public string? ParcialidadId { get; init; } 
    public string? TipoPago { get; init; } 
}
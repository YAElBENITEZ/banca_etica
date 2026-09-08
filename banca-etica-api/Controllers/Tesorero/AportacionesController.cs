using System.Globalization;
using System.Security.Claims;
using banca_etica_api.Data;
using banca_etica_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Tesorero;

[ApiController]
[Authorize(Roles = "Tesorero")]
[Route("api/tesorero/aportaciones")]
public class AportacionesController : ControllerBase
{
    private readonly AppDbContext _context;
    public AportacionesController(AppDbContext context) => _context = context;

    [HttpGet("periodos")]
    public async Task<IActionResult> Periodos()
    {
        var ciclo = await CicloActivo();
        if (ciclo is null) return BadRequest(new { mensaje = "La cooperativa no tiene un ciclo activo configurado." });
        await AsegurarPeriodoActual(ciclo);
        var periodos = await _context.PeriodosAportacion.Where(p => p.CicloId == ciclo.Id)
            .OrderByDescending(p => p.NumeroPeriodo)
            .Select(p => new { inicio = p.FechaCorte!.Value.ToString("yyyy-MM-dd"), etiqueta = p.NombrePeriodo })
            .ToListAsync();
        return Ok(periodos);
    }

    [HttpGet("bitacora")]
    public async Task<IActionResult> Bitacora([FromQuery] string inicio)
    {
        var periodo = await PeriodoDeFecha(inicio);
        if (periodo is null) return NotFound(new { mensaje = "No se encontró el periodo seleccionado." });
        var cooperativaId = CooperativaId();
        var socios = await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.CooperativaId == cooperativaId && u.Estatus == "ACTIVO" && u.Rol.Nombre == "SOCIO")
            .OrderBy(u => u.Nombres)
            .Select(u => new { id = u.Id, nombre = (u.Nombres + " " + u.ApellidoPaterno).Trim(), monto = _context.Aportaciones.Where(a => a.PeriodoId == periodo.Id && a.SocioId == u.Id).Select(a => (decimal?)a.Monto).FirstOrDefault() })
            .ToListAsync();
        var total = socios.Sum(s => s.monto ?? 0m);
        return Ok(new { socios, totalRecaudado = total, registrados = socios.Count(s => s.monto.HasValue), pendientes = socios.Count(s => !s.monto.HasValue) });
    }

    [HttpPost]
    public async Task<IActionResult> Registrar(RegistrarAportacionRequest request)
    {
        if (request.SocioId == Guid.Empty || request.Monto <= 0 || string.IsNullOrWhiteSpace(request.InicioPeriodo))
            return BadRequest(new { mensaje = "Socio, periodo y monto mayor a cero son obligatorios." });

        var periodo = await PeriodoDeFecha(request.InicioPeriodo);
        if (periodo is null) return NotFound(new { mensaje = "No se encontró el periodo seleccionado." });
        var cooperativaId = CooperativaId();
        var socio = await _context.Usuarios.Include(u => u.Rol).SingleOrDefaultAsync(u => u.Id == request.SocioId && u.CooperativaId == cooperativaId && u.Estatus == "ACTIVO" && u.Rol.Nombre == "SOCIO");
        if (socio is null) return BadRequest(new { mensaje = "El socio no pertenece a tu cooperativa." });
        if (await _context.Aportaciones.AnyAsync(a => a.PeriodoId == periodo.Id && a.SocioId == socio.Id))
            return Conflict(new { mensaje = "Ese socio ya tiene una aportación registrada en este periodo." });

        var config = await _context.ConfiguracionesAportacion.SingleAsync(c => c.CooperativaId == cooperativaId);
        if (!config.ManejaAportaciones) return BadRequest(new { mensaje = "La cooperativa no tiene habilitadas las aportaciones." });
        if (request.Monto < config.MontoMinimo || (config.MontoMaximo > 0 && request.Monto > config.MontoMaximo))
            return BadRequest(new { mensaje = $"El monto debe estar entre ${config.MontoMinimo:N2} y ${config.MontoMaximo:N2}." });
        if (config.TipoMonto == "FIJO" && request.Monto != config.MontoMinimo)
            return BadRequest(new { mensaje = $"La aportación debe ser exactamente de ${config.MontoMinimo:N2}." });

        _context.Aportaciones.Add(new Aportacion
        {
            Id = Guid.NewGuid(), PeriodoId = periodo.Id, SocioId = socio.Id, TesoreroId = UsuarioId(), Monto = request.Monto,
            FolioComprobante = $"APT-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..5].ToUpperInvariant()}", FechaRegistro = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Aportación registrada correctamente." });
    }

    private async Task<Ciclo?> CicloActivo() => await _context.Ciclos.OrderByDescending(c => c.FechaInicio)
        .FirstOrDefaultAsync(c => c.CooperativaId == CooperativaId() && c.Estatus == "ACTIVO");

    private async Task<PeriodoAportacion?> PeriodoDeFecha(string inicio)
    {
        if (!DateTime.TryParseExact(inicio, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha)) return null;
        var ciclo = await CicloActivo();
        return ciclo is null ? null : await _context.PeriodosAportacion.SingleOrDefaultAsync(p => p.CicloId == ciclo.Id && p.FechaCorte == DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc));
    }

    private async Task AsegurarPeriodoActual(Ciclo ciclo)
    {
        var config = await _context.ConfiguracionesAportacion.SingleAsync(c => c.CooperativaId == ciclo.CooperativaId);
        var hoy = DateTime.UtcNow.Date;
        var baseFecha = hoy < ciclo.FechaInicio.Date ? ciclo.FechaInicio.Date : hoy > ciclo.FechaFin.Date ? ciclo.FechaFin.Date : hoy;
        var inicio = config.Periodicidad switch
        {
            "Semanal" => baseFecha.AddDays(-((int)baseFecha.DayOfWeek + 6) % 7),
            "Quincenal" => new DateTime(baseFecha.Year, baseFecha.Month, baseFecha.Day <= 15 ? 1 : 16),
            _ => new DateTime(baseFecha.Year, baseFecha.Month, 1)
        };
        inicio = DateTime.SpecifyKind(inicio, DateTimeKind.Utc);
        if (await _context.PeriodosAportacion.AnyAsync(p => p.CicloId == ciclo.Id && p.FechaCorte == inicio)) return;
        var numero = await _context.PeriodosAportacion.Where(p => p.CicloId == ciclo.Id).CountAsync() + 1;
        _context.PeriodosAportacion.Add(new PeriodoAportacion { Id = Guid.NewGuid(), CicloId = ciclo.Id, NumeroPeriodo = numero, FechaCorte = inicio, NombrePeriodo = NombrePeriodo(inicio, config.Periodicidad) });
        await _context.SaveChangesAsync();
    }

    private static string NombrePeriodo(DateTime fecha, string periodicidad) => periodicidad switch
    {
        "Semanal" => $"Semana del {fecha:dd/MM/yyyy}",
        "Quincenal" => $"{(fecha.Day == 1 ? "Primera" : "Segunda")} quincena de {fecha.ToString("MMMM yyyy", new CultureInfo("es-MX"))}",
        _ => fecha.ToString("MMMM yyyy", new CultureInfo("es-MX"))
    };
    private Guid UsuarioId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private Guid CooperativaId() => Guid.Parse(User.FindFirstValue("cooperativaId")!);
}

public sealed class RegistrarAportacionRequest { public Guid SocioId { get; init; } public string? InicioPeriodo { get; init; } public decimal Monto { get; init; } }

using System.Security.Claims;
using banca_etica_api.Data;
using banca_etica_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Tesorero;

[ApiController]
[Authorize(Roles = "Tesorero")]
[Route("api/tesorero/cierre")]
public class CierreCicloController : ControllerBase
{
    private readonly AppDbContext _context;
    public CierreCicloController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> Consultar()
    {
        var ciclo = await UltimoCicloConCierre();
        if (ciclo is null) return Ok(new { cierre = (object?)null });
        return Ok(await RespuestaCierre(ciclo));
    }

    [HttpPost("finalizar")]
    public async Task<IActionResult> Finalizar()
    {
        var ciclo = await _context.Ciclos.FirstOrDefaultAsync(c => c.CooperativaId == CooperativaId() && c.Estatus == "ACTIVO");
        if (ciclo is null) return BadRequest(new { mensaje = "No hay un ciclo activo para cerrar." });
        if (DateTime.UtcNow.Date < ciclo.FechaFin.Date) return BadRequest(new { mensaje = "El ciclo solo puede cerrarse al llegar su fecha final." });
        if (await _context.DistribucionesCierre.AnyAsync(d => d.CicloId == ciclo.Id)) return Ok(await RespuestaCierre(ciclo));

        var aportaciones = await _context.Aportaciones.Include(a => a.Socio).Where(a => a.Periodo.CicloId == ciclo.Id).ToListAsync();
        if (aportaciones.Count == 0) return BadRequest(new { mensaje = "No hay aportaciones registradas para cerrar el ciclo." });
        var config = await _context.ConfiguracionesRendimiento.SingleAsync(c => c.CooperativaId == CooperativaId());
        var totalAportaciones = aportaciones.Sum(a => a.Monto);
        var periodos = NumeroPeriodos(ciclo, config.PeriodicidadCalculo);
        var totalRendimientos = config.GeneraRendimientos ? Decimal.Round(totalAportaciones * (config.Porcentaje ?? 0m) / 100m * periodos, 2, MidpointRounding.AwayFromZero) : 0m;
        var porSocio = aportaciones.GroupBy(a => a.SocioId).Select(g => new { Socio = g.First().Socio, Total = g.Sum(a => a.Monto) }).ToList();
        var saldos = await _context.Prestamos.Where(p => p.CicloId == ciclo.Id && p.Estatus == "ACTIVO").GroupBy(p => p.SocioId).Select(g => new { SocioId = g.Key, Saldo = g.Sum(p => p.SaldoPendiente) }).ToDictionaryAsync(x => x.SocioId, x => x.Saldo);

        foreach (var item in porSocio)
        {
            var rendimiento = Decimal.Round(totalRendimientos * item.Total / totalAportaciones, 2, MidpointRounding.AwayFromZero);
            var bruto = item.Total + rendimiento;
            // La deuda se descuenta solo de la entrega final del socio; el préstamo mantiene su saldo.
            var deduccion = Math.Min(bruto, saldos.GetValueOrDefault(item.Socio.Id));
            _context.DistribucionesCierre.Add(new DistribucionCierre
            {
                Id = Guid.NewGuid(), CicloId = ciclo.Id, SocioId = item.Socio.Id, TotalAportado = item.Total,
                RendimientosGenerados = rendimiento, DeduccionesPrestamos = deduccion, TotalAEntregar = bruto - deduccion,
                Estatus = "PENDIENTE"
            });
        }
        ciclo.Estatus = "FINALIZADO";
        ciclo.FechaCierre = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(await RespuestaCierre(ciclo));
    }

    [HttpPost("distribuciones/{id:guid}/marcar-pagado")]
    public async Task<IActionResult> MarcarPagado(Guid id)
    {
        var distribucion = await _context.DistribucionesCierre.Include(d => d.Ciclo).SingleOrDefaultAsync(d => d.Id == id && d.Ciclo.CooperativaId == CooperativaId());
        if (distribucion is null) return NotFound(new { mensaje = "Distribución no encontrada." });
        if (distribucion.Estatus == "PAGADO") return BadRequest(new { mensaje = "La entrega ya fue registrada." });
        distribucion.Estatus = "PAGADO";
        distribucion.TesoreroEntregaId = UsuarioId();
        distribucion.FechaEntrega = DateTime.UtcNow;
        distribucion.FolioComprobante = $"CIE-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..5].ToUpperInvariant()}";
        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Entrega registrada correctamente." });
    }

    private async Task<Ciclo?> UltimoCicloConCierre() => await _context.Ciclos.Where(c => c.CooperativaId == CooperativaId() && c.Estatus == "FINALIZADO").OrderByDescending(c => c.FechaCierre).FirstOrDefaultAsync();
    private async Task<object> RespuestaCierre(Ciclo ciclo)
    {
        var distribuciones = await _context.DistribucionesCierre.Include(d => d.Socio).Where(d => d.CicloId == ciclo.Id).OrderBy(d => d.Socio.Nombres).ToListAsync();
        var totalAportaciones = distribuciones.Sum(d => d.TotalAportado);
        var rendimientos = distribuciones.Sum(d => d.RendimientosGenerados);
        var totalEntregado = distribuciones.Where(d => d.Estatus == "PAGADO").Sum(d => d.TotalAEntregar);
        var periodos = NumeroPeriodos(ciclo, (await _context.ConfiguracionesRendimiento.SingleAsync(c => c.CooperativaId == CooperativaId())).PeriodicidadCalculo);
        return new { id = ciclo.Id, inicioCiclo = ciclo.FechaInicio, finCiclo = ciclo.FechaFin, periodosRendimiento = periodos, totalAportaciones, rendimientos, totalDisponible = totalAportaciones + rendimientos, totalEntregado, pendiente = distribuciones.Where(d => d.Estatus == "PENDIENTE").Sum(d => d.TotalAEntregar), distribuciones = distribuciones.Select(d => new { id = d.Id, socio = (d.Socio.Nombres + " " + d.Socio.ApellidoPaterno).Trim(), aportaciones = d.TotalAportado, bruto = d.TotalAportado + d.RendimientosGenerados, saldoPrestamo = d.DeduccionesPrestamos, descuentoPrestamo = d.DeduccionesPrestamos, entregable = d.TotalAEntregar, estado = d.Estatus == "PAGADO" ? "Pagado" : "Pendiente", fechaPago = d.FechaEntrega }) };
    }
    private static int NumeroPeriodos(Ciclo ciclo, string? periodicidad) => periodicidad switch
    {
        "Semanal" => Math.Max(1, (int)Math.Ceiling((ciclo.FechaFin.Date - ciclo.FechaInicio.Date).TotalDays / 7)),
        "Quincenal" => Math.Max(1, (int)Math.Ceiling((ciclo.FechaFin.Date - ciclo.FechaInicio.Date).TotalDays / 15)),
        _ => Math.Max(1, ciclo.DuracionMeses)
    };
    private Guid UsuarioId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private Guid CooperativaId() => Guid.Parse(User.FindFirstValue("cooperativaId")!);
}

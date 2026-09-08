using System.Security.Claims;
using banca_etica_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Socio;

[ApiController]
[Authorize]
[Route("api/socio")]
public class SocioController : ControllerBase
{
    private readonly AppDbContext _context;
    public SocioController(AppDbContext context) => _context = context;

    [HttpGet("historial")]
    public async Task<IActionResult> Historial()
    {
        var socioId = UsuarioId();
        var aportaciones = await _context.Aportaciones.Where(a => a.SocioId == socioId).Select(a => new Operacion("Aportación", a.FechaRegistro, a.Monto, $"Aportación del periodo {a.Periodo.NombrePeriodo}")).ToListAsync();
        var prestamos = await _context.Prestamos.Where(p => p.SocioId == socioId).Select(p => new Operacion("Préstamo", p.FechaOtorgamiento, p.MontoOriginal, "Préstamo registrado por Tesorería")).ToListAsync();
        var pagos = await _context.PagosPrestamo.Where(p => p.Prestamo.SocioId == socioId).Select(p => new Operacion("Pago", p.FechaPago, p.TotalPagado, p.TipoPago == "MOROSO" ? "Pago moroso registrado" : "Pago registrado")).ToListAsync();
        return Ok(aportaciones.Concat(prestamos).Concat(pagos).OrderByDescending(x => x.fecha));
    }

    [HttpGet("comprobantes")]
    public async Task<IActionResult> Comprobantes()
    {
        var socioId = UsuarioId();
        var aportaciones = await _context.Aportaciones.Where(a => a.SocioId == socioId).Select(a => new { id = a.FolioComprobante, tipo = "Aportación", fecha = a.FechaRegistro, monto = a.Monto, concepto = "Aportación a la cooperativa" }).ToListAsync();
        var prestamos = await _context.Prestamos.Where(p => p.SocioId == socioId).Select(p => new { id = p.FolioComprobante, tipo = "Préstamo", fecha = p.FechaOtorgamiento, monto = p.MontoOriginal, concepto = "Préstamo otorgado" }).ToListAsync();
        var pagos = await _context.PagosPrestamo.Where(p => p.Prestamo.SocioId == socioId).Select(p => new { id = p.FolioComprobante, tipo = "Pago", fecha = p.FechaPago, monto = p.TotalPagado, concepto = p.TipoPago == "MOROSO" ? "Pago de préstamo con multa" : "Pago de préstamo" }).ToListAsync();
        return Ok(aportaciones.Cast<object>().Concat(prestamos).Concat(pagos));
    }

    [HttpGet("resumen-financiero")]
    public async Task<IActionResult> Resumen()
    {
        var socioId = UsuarioId();
        var aportaciones = _context.Aportaciones.Where(a => a.SocioId == socioId);
        var prestamos = _context.Prestamos.Where(p => p.SocioId == socioId);
        var pagos = _context.PagosPrestamo.Where(p => p.Prestamo.SocioId == socioId);
        return Ok(new { totalAportado = await aportaciones.SumAsync(a => (decimal?)a.Monto) ?? 0m, numeroAportaciones = await aportaciones.CountAsync(), totalPrestamosOtorgados = await prestamos.SumAsync(p => (decimal?)p.MontoOriginal) ?? 0m, totalPagadoPrestamos = await pagos.SumAsync(p => (decimal?)p.TotalPagado) ?? 0m, saldoPrestamosPendiente = await prestamos.SumAsync(p => (decimal?)p.SaldoPendiente) ?? 0m, interesesPagados = await pagos.SumAsync(p => (decimal?)p.Interes) ?? 0m, multasPagadas = await pagos.SumAsync(p => (decimal?)p.Multa) ?? 0m });
    }

    [HttpGet("cierre")]
    public async Task<IActionResult> Cierre()
    {
        var distribucion = await _context.DistribucionesCierre.Include(d => d.Ciclo).Where(d => d.SocioId == UsuarioId()).OrderByDescending(d => d.Ciclo.FechaCierre).FirstOrDefaultAsync();
        if (distribucion is null) return Ok(new { cierre = (object?)null });
        return Ok(new { inicioCiclo = distribucion.Ciclo.FechaInicio, finCiclo = distribucion.Ciclo.FechaFin, aportaciones = distribucion.TotalAportado, montoBruto = distribucion.TotalAportado + distribucion.RendimientosGenerados, saldoPrestamo = distribucion.DeduccionesPrestamos, descuentoPrestamo = distribucion.DeduccionesPrestamos, montoEntregable = distribucion.TotalAEntregar, estado = distribucion.Estatus == "PAGADO" ? "Pagado" : "Pendiente", fechaPago = distribucion.FechaEntrega, montoEntregado = distribucion.Estatus == "PAGADO" ? distribucion.TotalAEntregar : (decimal?)null });
    }

    private Guid UsuarioId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private record Operacion(string tipo, DateTime fecha, decimal monto, string detalle);
}

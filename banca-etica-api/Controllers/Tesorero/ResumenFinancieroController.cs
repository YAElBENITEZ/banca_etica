using System.Security.Claims;
using banca_etica_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Tesorero;

[ApiController]
[Authorize(Roles = "Tesorero")]
[Route("api/tesorero/resumen-financiero")]
public class ResumenFinancieroController : ControllerBase
{
    private readonly AppDbContext _context;
    public ResumenFinancieroController(AppDbContext context) => _context = context;
    [HttpGet]
    public async Task<IActionResult> Consultar()
    {
        var cooperativaId = Guid.Parse(User.FindFirstValue("cooperativaId")!);
        var aportaciones = _context.Aportaciones.Where(a => a.Periodo.Ciclo.CooperativaId == cooperativaId);
        var prestamos = _context.Prestamos.Where(p => p.CooperativaId == cooperativaId);
        var pagos = _context.PagosPrestamo.Where(p => p.Prestamo.CooperativaId == cooperativaId);
        var ultimoCierre = await _context.Ciclos.Where(c => c.CooperativaId == cooperativaId && c.Estatus == "FINALIZADO").OrderByDescending(c => c.FechaCierre).FirstOrDefaultAsync();
        var ultimoRendimiento = ultimoCierre is null ? 0m : await _context.DistribucionesCierre.Where(d => d.CicloId == ultimoCierre.Id).SumAsync(d => (decimal?)d.RendimientosGenerados) ?? 0m;
        var totalAportaciones = await aportaciones.SumAsync(a => (decimal?)a.Monto) ?? 0m;
        var totalPagos = await pagos.SumAsync(p => (decimal?)p.TotalPagado) ?? 0m;
        return Ok(new { totalAportaciones, totalPrestamosOtorgados = await prestamos.SumAsync(p => (decimal?)p.MontoOriginal) ?? 0m, totalPagosRecibidos = totalPagos, interesesCobrados = await pagos.SumAsync(p => (decimal?)p.Interes) ?? 0m, multasCobradas = await pagos.SumAsync(p => (decimal?)p.Multa) ?? 0m, saldoPrestamosPendiente = await prestamos.SumAsync(p => (decimal?)p.SaldoPendiente) ?? 0m, totalRecaudado = totalAportaciones + totalPagos, ultimoRendimientoGenerado = ultimoRendimiento, fechaUltimoCierre = ultimoCierre?.FechaCierre });
    }
}

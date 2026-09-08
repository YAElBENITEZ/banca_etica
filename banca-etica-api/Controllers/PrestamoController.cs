using System.Security.Claims;
using banca_etica_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers;

[ApiController]
[Authorize]
[Route("api/prestamo")]
public class PrestamoController : ControllerBase
{
    private readonly AppDbContext _context;
    public PrestamoController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> MisPrestamos()
    {
        var prestamos = await _context.Prestamos.Include(p => p.Pagos).Where(p => p.SocioId == UsuarioId()).OrderByDescending(p => p.FechaOtorgamiento).ToListAsync();
        return Ok(prestamos.Select(p => new { id = p.Id, proposito = "Préstamo registrado", montoOriginal = p.MontoOriginal, tasa = p.TasaInteres, plazoMeses = p.Plazo, tipoInteres = "Por periodo", estado = p.Estatus == "LIQUIDADO" ? "Liquidado" : "Activo", fechaDesembolso = p.FechaOtorgamiento, cajitaNombre = "Cooperativa", saldoPendiente = p.SaldoPendiente, pagos = Calendario(p) }));
    }

    private Guid UsuarioId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static IEnumerable<object> Calendario(Models.Prestamo prestamo)
    {
        var totalInteres = Decimal.Round(prestamo.MontoOriginal * prestamo.TasaInteres / 100m * prestamo.Plazo, 2, MidpointRounding.AwayFromZero);
        var capital = Decimal.Round(prestamo.MontoOriginal / prestamo.Plazo, 2, MidpointRounding.AwayFromZero);
        var interes = Decimal.Round(totalInteres / prestamo.Plazo, 2, MidpointRounding.AwayFromZero);
        var pagos = prestamo.Pagos.OrderBy(p => p.FechaPago).ToList();
        return Enumerable.Range(1, prestamo.Plazo).Select(numero =>
        {
            var pago = pagos.ElementAtOrDefault(numero - 1);
            return new { numero, vencimiento = prestamo.FechaOtorgamiento.AddMonths(numero), capital, interes, montoPagado = pago?.TotalPagado ?? 0m, multa = pago?.Multa ?? 0m, tipoPago = pago?.TipoPago == "MOROSO" ? "Moroso" : "Normal", estado = pago is null ? "Pendiente" : "Pagado" };
        });
    }
}

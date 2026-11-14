using System.Security.Claims;
using banca_etica_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Tesorero;

[ApiController]
[Authorize(Roles = "Tesorero")]
[Route("api/tesorero/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetDashboardData()
    {
        var tesoreroId = UsuarioId();

        // 1. Obtener la cooperativa asignada al tesorero logueado
        var usuarioTesorero = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == tesoreroId);

        if (usuarioTesorero?.CooperativaId == null)
            return BadRequest(new { mensaje = "El usuario no tiene una cooperativa asignada." });

        var cooperativaId = usuarioTesorero.CooperativaId.Value;

        var codigoCooperativa = await _context.Cooperativas
            .Where(c => c.Id == cooperativaId)
            .Select(c => c.Codigo)
            .ToListAsync();

        // 2. Socios activos de esta cooperativa
        var totalSocios = await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.CooperativaId == cooperativaId && u.Rol.Nombre == "SOCIO" && u.Estatus == "ACTIVO")
            .CountAsync();

        // 3. Ciclo activo vigente
        var cicloActivo = await _context.Ciclos
            .Include(c => c.Periodos)
            .Where(c => c.CooperativaId == cooperativaId && c.Estatus == "ACTIVO")
            .OrderByDescending(c => c.FechaInicio)
            .FirstOrDefaultAsync();

        // 4. Último periodo de aportación del ciclo
        var ultimoPeriodo = cicloActivo?.Periodos
            .OrderByDescending(p => p.NumeroPeriodo)
            .FirstOrDefault();

        // Monto recaudado en el periodo actual
        decimal aportacionesPeriodo = 0m;
        int aportacionesPendientes = totalSocios;
        string mesPeriodo = ultimoPeriodo?.NombrePeriodo ?? "Sin periodo";

        if (ultimoPeriodo != null)
        {
            var aportacionesActuales = await _context.Aportaciones
                .Where(a => a.PeriodoId == ultimoPeriodo.Id)
                .ToListAsync();

            aportacionesPeriodo = aportacionesActuales.Sum(a => a.Monto);

            // Socios que aportaron en este periodo
            var sociosAportaron = aportacionesActuales.Select(a => a.SocioId).Distinct().Count();
            aportacionesPendientes = Math.Max(0, totalSocios - sociosAportaron);
        }

        // 5. Métricas de Préstamos
        var prestamosActivosQuery = _context.Prestamos
            .Where(p => p.CooperativaId == cooperativaId && p.Estatus == "ACTIVO");

        int prestamosActivos = await prestamosActivosQuery.CountAsync();
        int prestamosPendientesPago = await prestamosActivosQuery
            .Where(p => p.SaldoPendiente > 0)
            .CountAsync();

        // 6. Total Recaudado (Aportaciones históricas de la cooperativa + pagos de préstamos recibidos)
        var totalAportacionesHistoricas = await _context.Aportaciones
            .Where(a => a.Periodo.Ciclo.CooperativaId == cooperativaId)
            .SumAsync(a => (decimal?)a.Monto) ?? 0m;

        var totalPagosPrestamos = await _context.PagosPrestamo
            .Where(p => p.Prestamo.CooperativaId == cooperativaId)
            .SumAsync(p => (decimal?)p.TotalPagado) ?? 0m;

        decimal totalRecaudado = totalAportacionesHistoricas + totalPagosPrestamos;

        // 7. Rendimientos generados (intereses cobrados en préstamos o registros en DistribucionCierre)
        decimal rendimientosGenerados = await _context.PagosPrestamo
            .Where(p => p.Prestamo.CooperativaId == cooperativaId)
            .SumAsync(p => (decimal?)p.Interes) ?? 0m;

        if (rendimientosGenerados == 0m && cicloActivo != null)
        {
            rendimientosGenerados = await _context.DistribucionesCierre
                .Where(d => d.CicloId == cicloActivo.Id)
                .SumAsync(d => (decimal?)d.RendimientosGenerados) ?? 0m;
        }

        // 8. Datos del Ciclo
        string cicloActual = cicloActivo != null 
            ? $"{cicloActivo.FechaInicio.Year}" 
            : "No configurado";

        string estadoCiclo = cicloActivo?.Estatus ?? "PENDIENTE";

        string proximoPeriodoAportacion = ultimoPeriodo?.FechaCorte.HasValue == true
            ? ultimoPeriodo.FechaCorte.Value.ToString("MMMM yyyy")
            : (cicloActivo != null ? "Pendiente de corte" : "Sin definir");

        return Ok(new
        {
            socios = totalSocios,
            aportacionesPeriodo,
            mesPeriodo,
            codigoCooperativa,
            prestamosActivos,
            totalRecaudado,
            rendimientosGenerados,
            cicloActual,
            estadoCiclo,
            proximoPeriodoAportacion,
            aportacionesPendientes,
            prestamosPendientesPago
        });
    }

    private Guid UsuarioId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
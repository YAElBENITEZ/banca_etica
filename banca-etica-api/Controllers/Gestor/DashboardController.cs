using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using banca_etica_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Gestor;

[ApiController]
[Authorize(Roles = "Gestor")]
[Route("api/gestor/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetDashboardData(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = 10)
    {
        if (pagina < 1) pagina = 1;
        if (tamano < 1 || tamano > 50) tamano = 10;

        var gestorRolId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var tesoreroRolId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        // 1. Métricas Globales
        int cooperativasTotales = await _context.Cooperativas.CountAsync();

        int usuariosCooperativasTotales = await _context.Usuarios
            .Where(u => u.RolId != gestorRolId)
            .CountAsync();

        int usuariosTesorerosTotales = await _context.Usuarios
            .Where(u => u.RolId == tesoreroRolId)
            .CountAsync();

        // Cooperativas que tienen al menos un ciclo configurado y activo
        int cooperativasConfCompletas = await _context.Ciclos
            .Where(c => c.Estatus == "ACTIVO")
            .Select(c => c.CooperativaId)
            .Distinct()
            .CountAsync();

        int cooperativasConfPend = Math.Max(0, cooperativasTotales - cooperativasConfCompletas);

        // 2. Consulta Paginada de Cooperativas con relación a Ciclos
        var cooperativasQuery = _context.Cooperativas.AsNoTracking();

        var cooperativasPaginadas = await cooperativasQuery
            .OrderByDescending(c => c.FechaCreacion)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .Select(c => new
            {
                id = c.Id,
                nombre = c.Nombre,
                fechaCreacion = c.FechaCreacion,
                activa = c.Estatus == "ACTIVA",
                tesorero = c.Tesorero == null
                    ? null
                    : (c.Tesorero.Nombres + " " + c.Tesorero.ApellidoPaterno).Trim(),
                totalSocios = c.Socios.Count(s => s.Rol.Nombre == "SOCIO" && s.Estatus == "ACTIVO"),
                // Relación directa: verifica si la cooperativa cuenta con ciclo activo
                tieneCicloConfigurado = _context.Ciclos.Any(ciclo => ciclo.CooperativaId == c.Id && ciclo.Estatus == "ACTIVO")
            })
            .ToListAsync();

        return Ok(new
        {
            metricas = new
            {
                cooperativasTotales,
                usuariosCooperativasTotales,
                usuariosTesorerosTotales,
                cooperativasConfCompletas,
                cooperativasConfPend
            },
            paginacion = new
            {
                paginaActual = pagina,
                tamanoPagina = tamano,
                totalRegistros = cooperativasTotales,
                totalPaginas = (int)Math.Ceiling(cooperativasTotales / (double)tamano),
                datos = cooperativasPaginadas
            }
        });
    }
}
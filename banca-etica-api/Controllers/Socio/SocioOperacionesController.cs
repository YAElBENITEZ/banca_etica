using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using banca_etica_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Socio;

[ApiController]
[Route("api/socio")]
[Authorize(Roles = "33333333-3333-3333-3333-333333333333,22222222-2222-2222-2222-222222222222,SOCIO,TESORERO,Socio,Tesorero")]
public class SocioOperacionesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWhatsAppService _whatsAppService;
    private readonly ILogger<SocioOperacionesController> _logger;

    // GUIDs oficiales de los roles
    private static readonly Guid RolSocioId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid RolTesoreroId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public SocioOperacionesController(
        AppDbContext context, 
        IWhatsAppService whatsAppService,
        ILogger<SocioOperacionesController> logger)
    {
        _context = context;
        _whatsAppService = whatsAppService;
        _logger = logger;
    }

    #region 1. RESUMEN FINANCIERO Y DASHBOARD

    /// <summary>
    /// GET: api/socio/resumen-financiero
    /// Alimenta las tarjetas superiores de MiResumenFinanciero.tsx y Dashboard.tsx.
    /// Soporta consulta de otro socio si quien invoca es Tesorero: ?socioId={guid}
    /// </summary>
    [HttpGet("resumen-financiero")]
    public async Task<IActionResult> ObtenerResumenFinanciero([FromQuery] Guid? socioId = null)
    {
        var targetId = ResolverSocioObjetivoId(socioId);
        if (targetId == Guid.Empty)
            return Unauthorized(new { mensaje = "Sesión no válida o no identificada." });

        // 1. Aportaciones realizadas
        var aportacionesQuery = _context.Aportaciones.Where(a => a.SocioId == targetId);
        var totalAportado = await aportacionesQuery.SumAsync(a => (decimal?)a.Monto) ?? 0m;
        var numeroAportaciones = await aportacionesQuery.CountAsync();

        // 2. Préstamos otorgados y saldos
        var prestamosQuery = _context.Prestamos.Where(p => p.SocioId == targetId);
        var totalPrestamosOtorgados = await prestamosQuery.SumAsync(p => (decimal?)p.MontoOriginal) ?? 0m;
        var saldoPrestamosPendiente = await prestamosQuery
            .Where(p => p.Estatus == "ACTIVO")
            .SumAsync(p => (decimal?)p.SaldoPendiente) ?? 0m;

        // 3. Pagos realizados sobre préstamos
        var pagosQuery = _context.PagosPrestamo.Where(pg => pg.Prestamo.SocioId == targetId);
        var totalPagadoPrestamos = await pagosQuery.SumAsync(pg => (decimal?)pg.TotalPagado) ?? 0m;
        var interesesPagados = await pagosQuery.SumAsync(pg => (decimal?)pg.Interes) ?? 0m;
        var multasPagadas = await pagosQuery.SumAsync(pg => (decimal?)pg.Multa) ?? 0m;

        return Ok(new
        {
            totalAportado,
            numeroAportaciones,
            totalPrestamosOtorgados,
            totalPagadoPrestamos,
            saldoPrestamosPendiente,
            interesesPagados,
            multasPagadas
        });
    }

    #endregion

    #region 2. HISTORIAL DE MOVIMIENTOS

    /// <summary>
    /// GET: api/socio/historial
    /// Alimenta la cronología de movimientos de MiHistorial.tsx y actividad reciente de Dashboard.tsx.
    /// </summary>
    [HttpGet("historial")]
    public async Task<IActionResult> ObtenerHistorial([FromQuery] Guid? socioId = null)
    {
        var targetId = ResolverSocioObjetivoId(socioId);
        if (targetId == Guid.Empty)
            return Unauthorized(new { mensaje = "Sesión no válida o no identificada." });

        // 1. Aportaciones del socio
        var aportaciones = await _context.Aportaciones
            .AsNoTracking()
            .Include(a => a.Periodo)
            .Where(a => a.SocioId == targetId)
            .Select(a => new
            {
                tipo = "Aportación",
                fecha = a.FechaRegistro,
                monto = a.Monto,
                detalle = a.Periodo != null && !string.IsNullOrEmpty(a.Periodo.NombrePeriodo)
                    ? $"Aportación {a.Periodo.NombrePeriodo}"
                    : $"Aportación confirmada (Folio: {a.FolioComprobante})"
            })
            .ToListAsync();

        // 2. Préstamos otorgados
        var prestamos = await _context.Prestamos
            .AsNoTracking()
            .Where(p => p.SocioId == targetId)
            .Select(p => new
            {
                tipo = "Préstamo",
                fecha = p.FechaOtorgamiento,
                monto = p.MontoOriginal,
                detalle = $"Financiamiento otorgado a {p.Plazo} meses ({p.TasaInteres}% interés)"
            })
            .ToListAsync();

        // 3. Pagos realizados a préstamos
        var pagos = await _context.PagosPrestamo
            .AsNoTracking()
            .Include(pg => pg.Prestamo)
            .Where(pg => pg.Prestamo.SocioId == targetId)
            .Select(pg => new
            {
                tipo = "Pago",
                fecha = pg.FechaPago,
                monto = pg.TotalPagado,
                detalle = pg.TipoPago == "MOROSO"
                    ? $"Pago moroso con multa (Restante: {pg.SaldoRestante:C})"
                    : $"Abono a préstamo (Restante: {pg.SaldoRestante:C})"
            })
            .ToListAsync();

        // 4. Consolidar cronológicamente descendente
        var movimientos = aportaciones
            .Concat(prestamos)
            .Concat(pagos)
            .OrderByDescending(m => m.fecha)
            .Select(m => new
            {
                m.tipo,
                fecha = m.fecha.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                m.monto,
                m.detalle
            })
            .ToList();

        return Ok(movimientos);
    }

    #endregion

    #region 3. COMPROBANTES

    /// <summary>
    /// GET: api/socio/comprobantes
    /// Alimenta MisComprobantes.tsx
    /// </summary>
    [HttpGet("comprobantes")]
    public async Task<IActionResult> ObtenerComprobantes([FromQuery] Guid? socioId = null)
    {
        var targetId = ResolverSocioObjetivoId(socioId);
        if (targetId == Guid.Empty)
            return Unauthorized(new { mensaje = "Sesión no válida o no identificada." });

        var comprobantes = new List<object>();

        // Aportaciones con comprobante
        var aportaciones = await _context.Aportaciones
            .AsNoTracking()
            .Include(a => a.Periodo)
            .Where(a => a.SocioId == targetId && !string.IsNullOrEmpty(a.FolioComprobante))
            .OrderByDescending(a => a.FechaRegistro)
            .Select(a => new
            {
                id = a.FolioComprobante,
                tipo = "Aportación",
                fecha = a.FechaRegistro,
                monto = a.Monto,
                concepto = a.Periodo != null ? $"Aportación a {a.Periodo.NombrePeriodo}" : "Aportación a la cooperativa"
            })
            .ToListAsync();

        comprobantes.AddRange(aportaciones);

        // Préstamos otorgados
        var prestamos = await _context.Prestamos
            .AsNoTracking()
            .Where(p => p.SocioId == targetId && !string.IsNullOrEmpty(p.FolioComprobante))
            .OrderByDescending(p => p.FechaOtorgamiento)
            .Select(p => new
            {
                id = p.FolioComprobante,
                tipo = "Préstamo",
                fecha = p.FechaOtorgamiento,
                monto = p.MontoOriginal,
                concepto = "Préstamo otorgado por Tesorería"
            })
            .ToListAsync();

        comprobantes.AddRange(prestamos);

        // Pagos de préstamos
        var pagos = await _context.PagosPrestamo
            .AsNoTracking()
            .Include(p => p.Prestamo)
            .Where(p => p.Prestamo.SocioId == targetId && !string.IsNullOrEmpty(p.FolioComprobante))
            .OrderByDescending(p => p.FechaPago)
            .Select(p => new
            {
                id = p.FolioComprobante,
                tipo = "Pago",
                fecha = p.FechaPago,
                monto = p.TotalPagado,
                concepto = p.TipoPago == "MOROSO" 
                    ? $"Pago moroso con multa (Préstamo #{p.Prestamo.FolioComprobante})" 
                    : $"Pago de cuota ordinaria (Préstamo #{p.Prestamo.FolioComprobante})"
            })
            .ToListAsync();

        comprobantes.AddRange(pagos);

        return Ok(comprobantes);
    }

    #endregion

    #region 4. CIERRE DE CICLO

    /// <summary>
    /// GET: api/socio/cierre
    /// Alimenta MiCierre.tsx
    /// </summary>
    [HttpGet("cierre")]
    public async Task<IActionResult> ObtenerCierre([FromQuery] Guid? socioId = null)
    {
        var targetId = ResolverSocioObjetivoId(socioId);
        if (targetId == Guid.Empty)
            return Unauthorized(new { mensaje = "Sesión no válida o no identificada." });

        var socio = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == targetId);

        if (socio?.CooperativaId == null)
            return Ok(new { cierre = (object?)null });

        // Ciclo cerrado o en curso
        var ciclo = await _context.Ciclos
            .AsNoTracking()
            .Where(c => c.CooperativaId == socio.CooperativaId)
            .OrderByDescending(c => c.FechaFin)
            .FirstOrDefaultAsync();

        if (ciclo == null)
            return Ok(new { cierre = (object?)null });

        var distribucion = await _context.DistribucionesCierre
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.CicloId == ciclo.Id && d.SocioId == targetId);

        if (distribucion == null)
            return Ok(new { cierre = (object?)null });

        var prestamosPendientes = await _context.Prestamos
            .AsNoTracking()
            .Where(p => p.SocioId == targetId && p.CicloId == ciclo.Id)
            .SumAsync(p => (decimal?)p.SaldoPendiente) ?? 0m;

        return Ok(new
        {
            inicioCiclo = ciclo.FechaInicio.ToString("yyyy-MM-dd"),
            finCiclo = ciclo.FechaFin.ToString("yyyy-MM-dd"),
            aportaciones = distribucion.TotalAportado,
            montoBruto = distribucion.TotalAportado + distribucion.RendimientosGenerados,
            saldoPrestamo = prestamosPendientes,
            descuentoPrestamo = distribucion.DeduccionesPrestamos,
            montoEntregable = distribucion.TotalAEntregar,
            estado = distribucion.Estatus == "PAGADO" ? "Pagado" : "Pendiente",
            fechaPago = distribucion.FechaEntrega?.ToString("yyyy-MM-dd"),
            montoEntregado = distribucion.Estatus == "PAGADO" ? (decimal?)distribucion.TotalAEntregar : null
        });
    }

    #endregion

    #region 5. PRÉSTAMOS, TABLA DE AMORTIZACIÓN Y SOLICITUDES

    /// <summary>
    /// GET: api/socio/prestamos
    /// Consulta los préstamos activos y su calendario de amortización.
    /// </summary>
    [HttpGet("prestamos")]
    public async Task<IActionResult> ObtenerMisPrestamos([FromQuery] Guid? socioId = null)
    {
        var targetId = ResolverSocioObjetivoId(socioId);
        if (targetId == Guid.Empty)
            return Unauthorized(new { mensaje = "Sesión no válida o no identificada." });

        var prestamosDb = await _context.Prestamos
            .AsNoTracking()
            .Include(p => p.Pagos)
            .Include(p => p.Cooperativa)
            .Where(p => p.SocioId == targetId)
            .OrderByDescending(p => p.FechaOtorgamiento)
            .ToListAsync();

        var resultado = prestamosDb.Select(p =>
        {
            var pagosList = new List<PagoPrestamoSocioResponse>();
            var pagosOrdenados = p.Pagos.OrderBy(pago => pago.FechaPago).ToList();

            if (pagosOrdenados.Count > 0)
            {
                int num = 1;
                foreach (var pago in pagosOrdenados)
                {
                    pagosList.Add(new PagoPrestamoSocioResponse
                    {
                        Numero = num++,
                        Vencimiento = pago.FechaPago,
                        Capital = pago.MontoBase,
                        Interes = pago.Interes,
                        MontoPagado = pago.TotalPagado,
                        Multa = pago.Multa,
                        TipoPago = FormatearTexto(pago.TipoPago),
                        Estado = "Pagado"
                    });
                }
            }
            else
            {
                pagosList.Add(new PagoPrestamoSocioResponse
                {
                    Numero = 1,
                    Vencimiento = p.FechaOtorgamiento.AddMonths(1),
                    Capital = p.Plazo > 0 ? Math.Round(p.MontoOriginal / p.Plazo, 2) : p.MontoOriginal,
                    Interes = Math.Round(p.MontoOriginal * (p.TasaInteres / 100m), 2),
                    MontoPagado = 0m,
                    Multa = 0m,
                    TipoPago = "Ordinario",
                    Estado = "Pendiente"
                });
            }

            return new PrestamoSocioResponse
            {
                Id = p.Id,
                Proposito = !string.IsNullOrWhiteSpace(p.FolioComprobante)
                    ? $"Financiamiento #{p.FolioComprobante}"
                    : "Préstamo Personal",
                MontoOriginal = p.MontoOriginal,
                Tasa = p.TasaInteres,
                PlazoMeses = p.Plazo,
                TipoInteres = "Fijo Ordinario",
                Estado = FormatearTexto(p.Estatus),
                FechaDesembolso = p.FechaOtorgamiento,
                CajitaNombre = p.Cooperativa?.Nombre ?? "Fondo Comunitario",
                SaldoPendiente = p.SaldoPendiente,
                Pagos = pagosList
            };
        }).ToList();

        return Ok(resultado);
    }

    /// <summary>
    /// GET: api/socio/solicitudes
    /// Historial de solicitudes de financiamiento de emergencia realizadas.
    /// </summary>
    [HttpGet("solicitudes")]
    public async Task<IActionResult> ObtenerMisSolicitudes([FromQuery] Guid? socioId = null)
    {
        var targetId = ResolverSocioObjetivoId(socioId);
        if (targetId == Guid.Empty)
            return Unauthorized(new { mensaje = "Sesión no válida o no identificada." });

        var solicitudes = await _context.SolicitudesPrestamos
            .AsNoTracking()
            .Where(s => s.UsuarioId == targetId)
            .OrderByDescending(s => s.FechaSolicitud)
            .Select(s => new
            {
                id = s.Id,
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

    /// <summary>
    /// POST: api/socio/solicitar-emergencia
    /// Permite al socio o al tesorero en su cuenta personal ingresar una solicitud.
    /// </summary>
    [HttpPost("solicitar-emergencia")]
    public async Task<IActionResult> SolicitarPrestamoEmergencia([FromBody] SolicitudEmergenciaRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
    
        var usuarioId = ObtenerUsuarioIdSesion();
        if (usuarioId == Guid.Empty)
            return Unauthorized(new { mensaje = "Sesión no válida o no identificada." });
    
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario is null)
            return Unauthorized(new { mensaje = "El usuario no existe." });
    
        if (usuario.CooperativaId == null)
            return BadRequest(new { mensaje = "No perteneces a ninguna cooperativa activa para solicitar préstamos." });
    
        var tienePendiente = await _context.SolicitudesPrestamos
            .AnyAsync(s => s.UsuarioId == usuarioId && s.Estatus == "PENDIENTE");
    
        if (tienePendiente)
            return BadRequest(new { mensaje = "Ya cuentas con una solicitud pendiente de revisión por el comité." });
    
        var solicitud = new SolicitudPrestamo
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            CooperativaId = usuario.CooperativaId.Value,
            CantidadSolicitada = request.Monto,
            NumeroContactoInmediato = request.NumeroContacto.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            Estatus = "PENDIENTE",
            FechaSolicitud = DateTime.UtcNow
        };
    
        _context.SolicitudesPrestamos.Add(solicitud);
        await _context.SaveChangesAsync();
    
        // =========================================================
        // DISPARO DE NOTIFICACIÓN WHATSAPP A LOS TESOREROS
        // =========================================================
        try
        {
            // Buscamos usuarios con rol de Tesorero pertenecientes a esta cooperativa
            var tesoreros = await _context.Usuarios
                .AsNoTracking()
                .Where(u => u.CooperativaId == usuario.CooperativaId.Value 
                         && (u.RolId == RolTesoreroId || _context.Cooperativas.Any(c => c.Id == usuario.CooperativaId.Value && c.TesoreroId == u.Id))
                         && u.Estatus == "ACTIVO"
                         && !string.IsNullOrEmpty(u.Telefono))
                .ToListAsync();
    
            var nombreCompletoSocio = $"{usuario.Nombres} {usuario.ApellidoPaterno}".Trim();
            var fechaSolicitud = DateTime.UtcNow.ToString("dd/MM/yyyy");
    
            foreach (var tesorero in tesoreros)
            {
                var nombreTesorero = $"{tesorero.Nombres} {tesorero.ApellidoPaterno}".Trim();
    
                // Disparo asíncrono sin bloquear la respuesta si hay múltiples destinatarios
                _ = _whatsAppService.EnviarNotificacionPrestamoTesoreroAsync(
                    tesorero.Telefono!,
                    nombreTesorero,
                    nombreCompletoSocio,
                    fechaSolicitud,
                    solicitud.Descripcion ?? "Solicitud de emergencia"
                );
            }
        }
        catch (Exception ex)
        {
            // Salvaguarda: El registro de la solicitud ya ocurrió con éxito en la BD
            _logger.LogError(ex, "Fallo al consultar tesoreros o despachar notificación WhatsApp.");
        }
    
        return Ok(new
        {
            mensaje = "Solicitud de préstamo de emergencia registrada exitosamente.",
            solicitudId = solicitud.Id
        });
    }

    #endregion

    #region 6. MÉTODOS DE SOPORTE Y SEGURIDAD

    /// <summary>
    /// Obtiene el GUID del usuario a partir de los Claims del JWT
    /// </summary>
    private Guid ObtenerUsuarioIdSesion()
    {
        var claimId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User.FindFirst("id")?.Value
                   ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(claimId, out var id) ? id : Guid.Empty;
    }

    /// <summary>
    /// Verifica si el usuario autenticado tiene rol de Tesorero (por GUID o por Nombre)
    /// </summary>
    private bool EsTesorero()
    {
        var rolClaim = User.FindFirstValue(ClaimTypes.Role) 
                    ?? User.FindFirst("role")?.Value 
                    ?? User.FindFirst("Rol")?.Value;

        if (string.IsNullOrWhiteSpace(rolClaim)) 
            return false;

        // Comprobación por GUID o por nombre
        return rolClaim.Equals(RolTesoreroId.ToString(), StringComparison.OrdinalIgnoreCase)
            || rolClaim.Equals("TESORERO", StringComparison.OrdinalIgnoreCase)
            || User.IsInRole(RolTesoreroId.ToString())
            || User.IsInRole("TESORERO");
    }

    /// <summary>
    /// Si quien consulta es Tesorero y mandó un socioId en query param, consulta a ese socio.
    /// De lo contrario, devuelve el ID del usuario en sesión.
    /// </summary>
    private Guid ResolverSocioObjetivoId(Guid? socioIdQueryParam)
    {
        var usuarioActualId = ObtenerUsuarioIdSesion();

        if (EsTesorero() && socioIdQueryParam.HasValue && socioIdQueryParam.Value != Guid.Empty)
        {
            return socioIdQueryParam.Value;
        }

        return usuarioActualId;
    }

    private static string FormatearTexto(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) return string.Empty;
        var lower = texto.ToLowerInvariant();
        return char.ToUpperInvariant(lower[0]) + lower[1..];
    }

    #endregion
}
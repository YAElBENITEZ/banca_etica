using System.Security.Claims;
using BCrypt.Net;
using banca_etica_api.Data;
using banca_etica_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Gestor;

[ApiController]
[Authorize(Roles = "Gestor")]
[Route("api/gestor/cooperativas")]
public class CooperativasController : ControllerBase
{
    private readonly AppDbContext _context;

    public CooperativasController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var gestorId = UsuarioId();
        var cooperativas = await _context.Cooperativas
            .Where(c => c.GestorId == gestorId)
            .Include(c => c.Tesorero)
            .OrderBy(c => c.Nombre)
            .Select(c => new
            {
                id = c.Id,
                nombre = c.Nombre,
                fechaCreacion = c.FechaCreacion,
                activa = c.Estatus == "ACTIVA",
                tesorero = c.Tesorero == null ? null : (c.Tesorero.Nombres + " " + c.Tesorero.ApellidoPaterno).Trim(),
                totalSocios = c.Socios.Count(s => s.Rol.Nombre == "SOCIO" && s.Estatus == "ACTIVO")
            })
            .ToListAsync();

        return Ok(cooperativas);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearCooperativaRequest request)
    {
        var nombre = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { mensaje = "El nombre de la cooperativa es obligatorio." });

        var cooperativa = new Cooperativa
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Codigo = await GenerarCodigo(nombre),
            GestorId = UsuarioId(),
            Estatus = "ACTIVA",
            FechaCreacion = DateTime.UtcNow
        };

        _context.Cooperativas.Add(cooperativa);
        _context.ConfiguracionesAportacion.Add(new ConfiguracionAportacion
        {
            Id = Guid.NewGuid(), CooperativaId = cooperativa.Id, ManejaAportaciones = true,
            Periodicidad = "Mensual", MontoMinimo = 0, MontoMaximo = 0, TipoMonto = "VARIABLE"
        });
        _context.ConfiguracionesRendimiento.Add(new ConfiguracionRendimiento
        {
            Id = Guid.NewGuid(), CooperativaId = cooperativa.Id, GeneraRendimientos = false
        });
        _context.ConfiguracionesPrestamo.Add(new ConfiguracionPrestamo
        {
            Id = Guid.NewGuid(), CooperativaId = cooperativa.Id, ManejaPrestamos = false, RequiereAval = false
        });
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Detalle), new { id = cooperativa.Id }, new { id = cooperativa.Id, nombre = cooperativa.Nombre });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detalle(Guid id)
    {
        var cooperativa = await CooperativaDelGestor(id);
        if (cooperativa is null) return NotFound(new { mensaje = "Cooperativa no encontrada." });

        var configAportacion = await _context.ConfiguracionesAportacion.SingleOrDefaultAsync(c => c.CooperativaId == id);
        var configRendimiento = await _context.ConfiguracionesRendimiento.SingleOrDefaultAsync(c => c.CooperativaId == id);
        var configPrestamo = await _context.ConfiguracionesPrestamo.SingleOrDefaultAsync(c => c.CooperativaId == id);
        var ciclo = await _context.Ciclos.Where(c => c.CooperativaId == id && c.Estatus == "ACTIVO").OrderByDescending(c => c.FechaInicio).FirstOrDefaultAsync();

        return Ok(new
        {
            id = cooperativa.Id,
            nombre = cooperativa.Nombre,
            configuracion = new
            {
                manejaAportaciones = configAportacion?.ManejaAportaciones ?? true,
                periodicidadAportacion = configAportacion?.Periodicidad ?? "Mensual",
                montoMinimoAportacion = configAportacion?.MontoMinimo ?? 0m,
                montoMaximoAportacion = configAportacion?.MontoMaximo ?? 0m,
                montoAportacionFijo = configAportacion?.TipoMonto == "FIJO",
                generaRendimientos = configRendimiento?.GeneraRendimientos ?? false,
                porcentajeRendimiento = configRendimiento?.Porcentaje ?? 0m,
                periodicidadRendimiento = configRendimiento?.PeriodicidadCalculo ?? "Mensual",
                distribucionRendimiento = configRendimiento?.FormaDistribucion ?? "",
                manejaPrestamos = configPrestamo?.ManejaPrestamos ?? false,
                montoMinimoPrestamo = configPrestamo?.MontoMinimo ?? 0m,
                montoMaximoPrestamo = configPrestamo?.MontoMaximo ?? 0m,
                factorMaximoPrestamo = configPrestamo?.FactorMaximo ?? 0m,
                tasaInteres = configPrestamo?.TasaInteres ?? 0m,
                periodoInteres = configPrestamo?.PeriodoInteres ?? "",
                frecuenciaPago = configPrestamo?.FrecuenciaPago ?? "",
                plazoMaximoMeses = configPrestamo?.PlazoMaximoMeses ?? 0,
                multaMorosidad = configPrestamo?.MultaMoroso ?? 0m,
                inicioCiclo = ciclo?.FechaInicio,
                finCiclo = ciclo?.FechaFin,
                duracionCicloMeses = ciclo?.DuracionMeses ?? 0
            }
        });
    }

    [HttpGet("{id:guid}/socios")]
    public async Task<IActionResult> Socios(Guid id)
    {
        if (await CooperativaDelGestor(id) is null) return NotFound(new { mensaje = "Cooperativa no encontrada." });
        var socios = await _context.Usuarios.Include(u => u.Rol)
            .Where(u => u.CooperativaId == id && u.Rol.Nombre == "SOCIO" && u.Estatus == "ACTIVO")
            .OrderBy(u => u.Nombres).Select(u => new { id = u.Id, nombre = (u.Nombres + " " + u.ApellidoPaterno).Trim(), correo = u.Correo })
            .ToListAsync();
        return Ok(socios);
    }

    [HttpPut("{id:guid}/configuracion")]
    public async Task<IActionResult> GuardarConfiguracion(Guid id, ConfiguracionRequest request)
    {
        if (await CooperativaDelGestor(id) is null) return NotFound(new { mensaje = "Cooperativa no encontrada." });
        if (request.MontoMinimoAportacion < 0 || request.MontoMaximoAportacion < request.MontoMinimoAportacion ||
            request.MontoMinimoPrestamo < 0 || request.MontoMaximoPrestamo < request.MontoMinimoPrestamo)
            return BadRequest(new { mensaje = "Los montos configurados no son válidos." });

        var aportacion = await _context.ConfiguracionesAportacion.SingleAsync(c => c.CooperativaId == id);
        aportacion.ManejaAportaciones = request.ManejaAportaciones;
        aportacion.Periodicidad = request.PeriodicidadAportacion ?? "Mensual";
        aportacion.MontoMinimo = request.MontoMinimoAportacion;
        aportacion.MontoMaximo = request.MontoMaximoAportacion;
        aportacion.TipoMonto = request.MontoAportacionFijo ? "FIJO" : "VARIABLE";

        var rendimiento = await _context.ConfiguracionesRendimiento.SingleAsync(c => c.CooperativaId == id);
        rendimiento.GeneraRendimientos = request.GeneraRendimientos;
        rendimiento.Porcentaje = request.GeneraRendimientos ? request.PorcentajeRendimiento : null;
        rendimiento.PeriodicidadCalculo = request.GeneraRendimientos ? request.PeriodicidadRendimiento : null;
        rendimiento.FormaDistribucion = request.GeneraRendimientos ? request.DistribucionRendimiento : null;

        var prestamo = await _context.ConfiguracionesPrestamo.SingleAsync(c => c.CooperativaId == id);
        prestamo.ManejaPrestamos = request.ManejaPrestamos;
        prestamo.MontoMinimo = request.ManejaPrestamos ? request.MontoMinimoPrestamo : null;
        prestamo.MontoMaximo = request.ManejaPrestamos ? request.MontoMaximoPrestamo : null;
        prestamo.FactorMaximo = request.ManejaPrestamos ? request.FactorMaximoPrestamo : null;
        prestamo.TasaInteres = request.ManejaPrestamos ? request.TasaInteres : null;
        prestamo.PeriodoInteres = request.ManejaPrestamos ? request.PeriodoInteres : null;
        prestamo.FrecuenciaPago = request.ManejaPrestamos ? request.FrecuenciaPago : null;
        prestamo.PlazoMaximoMeses = request.ManejaPrestamos ? request.PlazoMaximoMeses : null;
        prestamo.MultaMoroso = request.ManejaPrestamos ? request.MultaMorosidad : null;

        if (request.InicioCiclo.HasValue && request.FinCiclo.HasValue && request.DuracionCicloMeses > 0)
        {
            if (request.FinCiclo <= request.InicioCiclo) return BadRequest(new { mensaje = "La fecha final del ciclo debe ser posterior a la inicial." });
            var ciclo = await _context.Ciclos.Where(c => c.CooperativaId == id && c.Estatus == "ACTIVO").FirstOrDefaultAsync();
            if (ciclo is null)
            {
                ciclo = new Ciclo { Id = Guid.NewGuid(), CooperativaId = id, Estatus = "ACTIVO" };
                _context.Ciclos.Add(ciclo);
            }
            ciclo.FechaInicio = AFechaUtc(request.InicioCiclo.Value);
            ciclo.FechaFin = AFechaUtc(request.FinCiclo.Value);
            ciclo.DuracionMeses = request.DuracionCicloMeses;
        }

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Configuración guardada correctamente." });
    }

    [HttpPost("{id:guid}/tesorero")]
    public async Task<IActionResult> CrearTesorero(Guid id, CrearTesoreroRequest request)
    {
        var cooperativa = await CooperativaDelGestor(id);
        if (cooperativa is null) return NotFound(new { mensaje = "Cooperativa no encontrada." });
        var correo = request.Correo?.Trim().ToLowerInvariant();
        if (request.SocioId == Guid.Empty || string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { mensaje = "Socio, correo y contraseña son obligatorios." });
        if (await _context.Usuarios.AnyAsync(u => u.Correo == correo)) return Conflict(new { mensaje = "Ese correo ya está registrado." });

        var socio = await _context.Usuarios.Include(u => u.Rol).SingleOrDefaultAsync(u => u.Id == request.SocioId && u.CooperativaId == id && u.Rol.Nombre == "SOCIO" && u.Estatus == "ACTIVO");
        if (socio is null) return BadRequest(new { mensaje = "El socio seleccionado no pertenece a esta cooperativa." });
        var rolTesorero = await _context.Roles.SingleAsync(r => r.Nombre == "TESORERO");

        var tesorero = new Usuario
        {
            Id = Guid.NewGuid(), RolId = rolTesorero.Id, CooperativaId = id, Nombres = socio.Nombres,
            ApellidoPaterno = socio.ApellidoPaterno, ApellidoMaterno = socio.ApellidoMaterno,
            FechaNacimiento = socio.FechaNacimiento, Telefono = socio.Telefono, Direccion = socio.Direccion,
            Correo = correo, PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            ConsentimientoArco = socio.ConsentimientoArco, Estatus = "ACTIVO", FechaRegistro = DateTime.UtcNow
        };
        _context.Usuarios.Add(tesorero);
        cooperativa.TesoreroId = tesorero.Id;
        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Cuenta de Tesorero creada y asignada correctamente." });
    }

    private Guid UsuarioId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private Task<Cooperativa?> CooperativaDelGestor(Guid id) => _context.Cooperativas.SingleOrDefaultAsync(c => c.Id == id && c.GestorId == UsuarioId());

    private async Task<string> GenerarCodigo(string nombre)
    {
        var baseCodigo = new string(nombre.Where(char.IsLetterOrDigit).Take(8).ToArray()).ToUpperInvariant();
        if (string.IsNullOrEmpty(baseCodigo)) baseCodigo = "COOP";
        var codigo = baseCodigo;
        var contador = 1;
        while (await _context.Cooperativas.AnyAsync(c => c.Codigo == codigo)) codigo = $"{baseCodigo}{contador++}";
        return codigo;
    }

    private static DateTime AFechaUtc(DateTime fecha) => DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc);
}

public sealed class CrearCooperativaRequest { public string? Nombre { get; init; } }
public sealed class CrearTesoreroRequest { public Guid SocioId { get; init; } public string? Correo { get; init; } public string? Password { get; init; } }
public sealed class ConfiguracionRequest
{
    public bool ManejaAportaciones { get; init; }
    public string? PeriodicidadAportacion { get; init; }
    public decimal MontoMinimoAportacion { get; init; }
    public decimal MontoMaximoAportacion { get; init; }
    public bool MontoAportacionFijo { get; init; }
    public bool GeneraRendimientos { get; init; }
    public decimal PorcentajeRendimiento { get; init; }
    public string? PeriodicidadRendimiento { get; init; }
    public string? DistribucionRendimiento { get; init; }
    public bool ManejaPrestamos { get; init; }
    public decimal MontoMinimoPrestamo { get; init; }
    public decimal MontoMaximoPrestamo { get; init; }
    public decimal FactorMaximoPrestamo { get; init; }
    public decimal TasaInteres { get; init; }
    public string? PeriodoInteres { get; init; }
    public string? FrecuenciaPago { get; init; }
    public int PlazoMaximoMeses { get; init; }
    public decimal MultaMorosidad { get; init; }
    public DateTime? InicioCiclo { get; init; }
    public DateTime? FinCiclo { get; init; }
    public int DuracionCicloMeses { get; init; }
}

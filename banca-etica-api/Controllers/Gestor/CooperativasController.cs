using System.Security.Claims;
using BCrypt.Net;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using banca_etica_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Gestor;

[ApiController]
[Authorize(Roles = "Gestor")]
[Route("api/gestor/cooperativas")]
public class CooperativasController : ControllerBase
{
    private static readonly Guid TesoreroRolId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid SocioRolId    = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorageService;

    public CooperativasController(AppDbContext context, IFileStorageService fileStorageService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var gestorId = UsuarioId();
        var cooperativas = await _context.Cooperativas
            // .Where(c => c.GestorId == gestorId)
            .Include(c => c.Tesorero)
            .OrderBy(c => c.Nombre)
            .Select(c => new
            {
                id = c.Id,
                nombre = c.Nombre,
                codigo = c.Codigo,
                imagenUrl = c.ImagenUrl, // <-- Incluido en el listado
                fechaCreacion = c.FechaCreacion,
                activa = c.Estatus == "ACTIVA",
                tesorero = c.Tesorero == null ? null : (c.Tesorero.Nombres + " " + c.Tesorero.ApellidoPaterno).Trim(),
                totalSocios = c.Socios.Count(s => s.Rol.Nombre == "SOCIO" && s.Estatus == "ACTIVO")
            })
            .ToListAsync();

        return Ok(cooperativas);
    }

    [HttpPost]
    [Consumes("multipart/form-data")] // <-- Permite recibir archivos
    public async Task<IActionResult> Crear([FromForm] CrearCooperativaRequest request)
    {
        var nombre = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { mensaje = "El nombre de la cooperativa es obligatorio." });

        string? driveFileId = null;
        if (request.Imagen != null && request.Imagen.Length > 0)
        {
            try
            {
                // Guarda en Google Drive y devuelve el ID del archivo
                driveFileId = await _fileStorageService.GuardarDocumentoAsync(request.Imagen);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al subir la imagen a Drive: {ex.Message}" });
            }
        }

        var cooperativa = new Cooperativa
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            ImagenUrl = driveFileId, // <-- Se almacena el fileId de Drive
            Codigo = await GenerarCodigo(),
            GestorId = UsuarioId(),
            Estatus = "ACTIVA",
            FechaCreacion = DateTime.UtcNow
        };

        _context.Cooperativas.Add(cooperativa);

        _context.ConfiguracionesAportacion.Add(new ConfiguracionAportacion
        {
            Id = Guid.NewGuid(),
            CooperativaId = cooperativa.Id,
            ManejaAportaciones = true,
            Periodicidad = "Mensual",
            MontoMinimo = 0,
            MontoMaximo = 0,
            TipoMonto = "VARIABLE"
        });

        _context.ConfiguracionesRendimiento.Add(new ConfiguracionRendimiento
        {
            Id = Guid.NewGuid(),
            CooperativaId = cooperativa.Id,
            GeneraRendimientos = false
        });

        _context.ConfiguracionesPrestamo.Add(new ConfiguracionPrestamo
        {
            Id = Guid.NewGuid(),
            CooperativaId = cooperativa.Id,
            ManejaPrestamos = false,
            RequiereAval = false
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
            codigo = cooperativa.Codigo,
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

        var socios = await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.CooperativaId == id && u.Rol.Nombre == "SOCIO" && u.Estatus == "ACTIVO")
            .OrderBy(u => u.Nombres)
            .Select(u => new 
            { 
                id = u.Id, 
                nombre = (u.Nombres + " " + u.ApellidoPaterno).Trim(), 
                correo = u.Correo 
            })
            .ToListAsync();

        return Ok(socios);
    }

    [HttpPut("{id:guid}/configuracion")]
    public async Task<IActionResult> GuardarConfiguracion(Guid id, [FromBody] ConfiguracionRequest request)
    {
        if (await CooperativaDelGestor(id) is null) return NotFound(new { mensaje = "Cooperativa no encontrada." });

        // if (request.MontoMinimoAportacion < 0 || request.MontoMaximoAportacion < request.MontoMinimoAportacion ||
        //     request.MontoMinimoPrestamo < 0 || request.MontoMaximoPrestamo < request.MontoMinimoPrestamo)
        // {
        //     return BadRequest(new { mensaje = "Los montos configurados no son válidos." });
        // }

        if (request.ManejaAportaciones && 
            (request.MontoMinimoAportacion < 0 || request.MontoMaximoAportacion < request.MontoMinimoAportacion))
        {
            return BadRequest(new { mensaje = "Los montos de aportación no son válidos." });
        }

        if (request.ManejaPrestamos && 
            (request.MontoMinimoPrestamo < 0 || request.MontoMaximoPrestamo < request.MontoMinimoPrestamo))
        {
            return BadRequest(new { mensaje = "Los montos de préstamo no son válidos." });
        }

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
            if (request.FinCiclo <= request.InicioCiclo)
                return BadRequest(new { mensaje = "La fecha final del ciclo debe ser posterior a la inicial." });

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
    public async Task<IActionResult> CrearTesorero(Guid id, [FromBody] CrearTesoreroRequest request)
    {
        var cooperativa = await CooperativaDelGestor(id);
        if (cooperativa is null) return NotFound(new { mensaje = "Cooperativa no encontrada." });

        var correo = request.Correo.Trim().ToLowerInvariant();
        if (request.SocioId == Guid.Empty || string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { mensaje = "Socio, correo y contraseña son obligatorios." });

        if (await _context.Usuarios.AnyAsync(u => u.Correo == correo))
            return Conflict(new { mensaje = "Ese correo ya está registrado." });

        var socio = await _context.Usuarios
            .Include(u => u.Rol)
            .SingleOrDefaultAsync(u => u.Id == request.SocioId && u.CooperativaId == id && u.Rol.Nombre == "SOCIO" && u.Estatus == "ACTIVO");

        if (socio is null)
            return BadRequest(new { mensaje = "El socio seleccionado no pertenece a esta cooperativa." });

        var tesorero = new Usuario
        {
            Id = Guid.NewGuid(),
            RolId = TesoreroRolId,
            CooperativaId = id,
            Nombres = socio.Nombres,
            ApellidoPaterno = socio.ApellidoPaterno,
            ApellidoMaterno = socio.ApellidoMaterno,
            FechaNacimiento = socio.FechaNacimiento,
            Telefono = socio.Telefono,
            Direccion = socio.Direccion,
            Correo = correo,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            ConsentimientoArco = socio.ConsentimientoArco,
            Estatus = "ACTIVO",
            FechaRegistro = DateTime.UtcNow
        };

        _context.Usuarios.Add(tesorero);
        cooperativa.TesoreroId = tesorero.Id;

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Cuenta de Tesorero creada y asignada correctamente." });
    }

    [HttpPost("{id:guid}/usuarios")]
    public async Task<IActionResult> CrearUsuarioCooperativa(Guid id, [FromBody] CrearUsuarioDto dto)
    {
        if (dto.RolId != TesoreroRolId && dto.RolId != SocioRolId)
        {
            return BadRequest(new { mensaje = "El rol proporcionado no es válido para esta operación." });
        }

        var cooperativa = await CooperativaDelGestor(id);
        if (cooperativa is null)
        {
            return NotFound(new { mensaje = "Cooperativa no encontrada o no pertenece al gestor." });
        }

        var correo = dto.Correo.Trim().ToLowerInvariant();
        var correoExiste = await _context.Usuarios.AnyAsync(u => u.Correo == correo);
        if (correoExiste)
        {
            return Conflict(new { mensaje = "Ya existe un usuario registrado con este correo electrónico." });
        }

        var nuevoUsuario = new Usuario
        {
            Id = Guid.NewGuid(),
            CooperativaId = id,
            RolId = dto.RolId,
            Nombres = dto.Nombres.Trim(),
            ApellidoPaterno = dto.ApellidoPaterno.Trim(),
            ApellidoMaterno = dto.ApellidoMaterno?.Trim(),
            NumeroSocio = dto.NumeroSocio?.Trim(),
            Correo = correo,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Telefono = dto.Telefono?.Trim(),
            Direccion = dto.Direccion?.Trim(),
            FechaNacimiento = dto.FechaNacimiento,
            ConsentimientoArco = dto.ConsentimientoArco,
            Estatus = "ACTIVO",
            FechaRegistro = DateTime.UtcNow
        };

        _context.Usuarios.Add(nuevoUsuario);

        // Si se sembró directamente como Tesorero, actualizamos la referencia en la Cooperativa
        if (dto.RolId == TesoreroRolId)
        {
            cooperativa.TesoreroId = nuevoUsuario.Id;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Usuario creado exitosamente.",
            id = nuevoUsuario.Id,
            nombre = $"{nuevoUsuario.Nombres} {nuevoUsuario.ApellidoPaterno}".Trim(),
            rolId = nuevoUsuario.RolId
        });
    }

    #region Metodos Auxiliares

    private Guid UsuarioId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private Task<Cooperativa?> CooperativaDelGestor(Guid id) =>
        _context.Cooperativas.SingleOrDefaultAsync(c => c.Id == id && c.GestorId == UsuarioId());

    private async Task<string> GenerarCodigo()
    {
        const string caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        string codigo;

        do
        {
            var randomString = new string(Enumerable.Repeat(caracteres, 6)
                .Select(s => s[random.Next(s.Length)]).ToArray());

            codigo = $"COOP-{randomString}";
        }
        while (await _context.Cooperativas.AnyAsync(c => c.Codigo == codigo));

        return codigo;
    }

    private static DateTime AFechaUtc(DateTime fecha) => DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc);

    #endregion
}

using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using banca_etica_api.Data;
using banca_etica_api.Models;
using banca_etica_api.DTOs;
using banca_etica_api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace banca_etica_api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string JwtSecret = "SuperClaveSecretaBancaEtica2026_ClaveLargaYSegura";
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public AuthController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    // NUEVO: Validación exclusiva por código exacto
    [HttpGet("validar-codigo/{codigo}")]
    public async Task<IActionResult> ValidarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            return BadRequest(new { mensaje = "Código inválido." });

        var codigoLimpio = codigo.Trim().ToUpperInvariant();

        var cooperativa = await _context.Cooperativas
            .Where(c => c.Codigo == codigoLimpio && c.Estatus == "ACTIVA")
            .Select(c => new { id = c.Id, nombre = c.Nombre })
            .FirstOrDefaultAsync();

        if (cooperativa is null)
            return NotFound(new { mensaje = "Código de cooperativa no encontrado." });

        return Ok(cooperativa);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromForm] RegisterRequest request)
    {
        var correo = request.Correo?.Trim().ToLowerInvariant();
        var nombre = request.NombreCompleto?.Trim();
        var codigoLimpio = request.CodigoCooperativa?.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(request.Telefono) || string.IsNullOrWhiteSpace(request.Celular) ||
            string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(codigoLimpio))
        {
            return BadRequest(new { mensaje = "Nombre, teléfono, celular, correo, contraseña y código de cooperativa son obligatorios." });
        }

        if (request.Ine == null || request.Curp == null || request.ComprobanteDomicilio == null)
        {
            return BadRequest(new { mensaje = "Los tres documentos (INE, CURP y Comprobante) son obligatorios." });
        }

        var cooperativa = await _context.Cooperativas
            .FirstOrDefaultAsync(c => c.Codigo == codigoLimpio && c.Estatus == "ACTIVA");
            
        if (cooperativa is null)
            return BadRequest(new { mensaje = "El código de la cooperativa no es válido." });

        if (await _context.Usuarios.AnyAsync(u => u.Correo == correo))
            return Conflict(new { mensaje = "Ya existe una cuenta con ese correo electrónico." });

        var rolSocio = await _context.Roles.SingleOrDefaultAsync(r => r.Nombre == "SOCIO");
        if (rolSocio is null)
            return StatusCode(500, new { mensaje = "No está configurado el rol de Socio." });

        var partes = nombre.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var socioId = Guid.NewGuid();

        var socio = new Usuario
        {
            Id = socioId,
            RolId = rolSocio.Id,
            CooperativaId = cooperativa.Id,
            NumeroSocio = $"{cooperativa.Codigo}-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}",
            Nombres = partes.FirstOrDefault() ?? nombre,
            ApellidoPaterno = partes.Skip(1).FirstOrDefault() ?? "SIN APELLIDO",
            ApellidoMaterno = partes.Skip(2).FirstOrDefault(),
            Telefono = request.Telefono.Trim(),
            Celular = request.Celular.Trim(),
            Correo = correo,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            ConsentimientoArco = request.ConsentimientoArco,
            Estatus = "PENDIENTE",
            FechaRegistro = DateTime.UtcNow
        };

        // 1. Guardar físicamente en ../banca-etica-docs/
        string rutaIne = await _fileStorage.GuardarDocumentoAsync(request.Ine);
        string rutaCurp = await _fileStorage.GuardarDocumentoAsync(request.Curp);
        string rutaComprobante = await _fileStorage.GuardarDocumentoAsync(request.ComprobanteDomicilio);

        // 2. Asociar los documentos al socio
        var documentos = new List<Documento>
        {
            new() { Id = Guid.NewGuid(), Tipo = "INE", Url = rutaIne, SocioId = socioId },
            new() { Id = Guid.NewGuid(), Tipo = "CURP", Url = rutaCurp, SocioId = socioId },
            new() { Id = Guid.NewGuid(), Tipo = "COMPROBANTE_DOMICILIO", Url = rutaComprobante, SocioId = socioId }
        };

        _context.Usuarios.Add(socio);
        _context.Documentos.AddRange(documentos);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Login), new { mensaje = "Registro exitoso. Tu cuenta de socio y documentos fueron registrados." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var correo = request.Correo?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { mensaje = "Correo y contraseña son obligatorios." });
    
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Cooperativa) // Ya lo traes incluido
            .SingleOrDefaultAsync(u => u.Correo == correo);
    
        if (usuario is null || usuario.Estatus == "INACTIVO" || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
    
        var rol = FormatearRol(usuario.Rol.Nombre);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Email, usuario.Correo),
            new Claim(ClaimTypes.Role, rol),
            new Claim("cooperativaId", usuario.CooperativaId?.ToString() ?? string.Empty)
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
    
        // Determinar si tiene cooperativa vinculada
        bool tieneCooperativa = usuario.Cooperativa != null;
    
        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            usuario = new
            {
                id = usuario.Id,
                nombre = $"{usuario.Nombres} {usuario.ApellidoPaterno}".Trim(),
                correo = usuario.Correo,
                rol,
                estatus = usuario.Estatus,
                tieneCooperativa,
                cooperativaId = usuario.CooperativaId,
                cooperativaNombre = usuario.Cooperativa?.Nombre,
                cooperativaImagen = usuario.Cooperativa?.ImagenUrl // ID de Drive o URL
            }
        });
    }

    private static string FormatearRol(string rol) => rol switch
    {
        "GESTOR" => "Gestor",
        "TESORERO" => "Tesorero",
        _ => "Socio"
    };
}

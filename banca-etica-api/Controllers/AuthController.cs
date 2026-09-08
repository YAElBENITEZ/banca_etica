using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using banca_etica_api.Data;
using banca_etica_api.Models;
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

    public AuthController(AppDbContext context) => _context = context;

    [HttpGet("cooperativas")]
    public async Task<IActionResult> Cooperativas()
    {
        var cooperativas = await _context.Cooperativas
            .Where(c => c.Estatus == "ACTIVA")
            .OrderBy(c => c.Nombre)
            .Select(c => new { id = c.Id, nombre = c.Nombre })
            .ToListAsync();

        return Ok(cooperativas);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var correo = request.Correo?.Trim().ToLowerInvariant();
        var nombre = request.NombreCompleto?.Trim();

        if (string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(request.Telefono) ||
            string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(request.Password) ||
            request.CooperativaId == Guid.Empty)
        {
            return BadRequest(new { mensaje = "Nombre, teléfono, correo, contraseña y cooperativa son obligatorios." });
        }

        var cooperativa = await _context.Cooperativas
            .FirstOrDefaultAsync(c => c.Id == request.CooperativaId && c.Estatus == "ACTIVA");
        if (cooperativa is null)
            return BadRequest(new { mensaje = "La cooperativa seleccionada no está disponible." });

        if (await _context.Usuarios.AnyAsync(u => u.Correo == correo))
            return Conflict(new { mensaje = "Ya existe una cuenta con ese correo electrónico." });

        var rolSocio = await _context.Roles.SingleOrDefaultAsync(r => r.Nombre == "SOCIO");
        if (rolSocio is null)
            return StatusCode(500, new { mensaje = "No está configurado el rol de Socio." });

        var partes = nombre.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var socio = new Usuario
        {
            Id = Guid.NewGuid(),
            RolId = rolSocio.Id,
            CooperativaId = cooperativa.Id,
            NumeroSocio = $"{cooperativa.Codigo}-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}",
            Nombres = partes.FirstOrDefault() ?? nombre,
            ApellidoPaterno = partes.Skip(1).FirstOrDefault() ?? "SIN APELLIDO",
            ApellidoMaterno = partes.Skip(2).FirstOrDefault(),
            Telefono = request.Telefono.Trim(),
            Correo = correo,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            ConsentimientoArco = request.ConsentimientoArco,
            Estatus = "ACTIVO",
            FechaRegistro = DateTime.UtcNow
        };

        _context.Usuarios.Add(socio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Login), new { mensaje = "Registro exitoso. Tu cuenta de socio fue creada." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var correo = request.Correo?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { mensaje = "Correo y contraseña son obligatorios." });

        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Cooperativa)
            .SingleOrDefaultAsync(u => u.Correo == correo);

        if (usuario is null || usuario.Estatus != "ACTIVO" || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
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

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            usuario = new
            {
                id = usuario.Id,
                nombre = $"{usuario.Nombres} {usuario.ApellidoPaterno}".Trim(),
                correo = usuario.Correo,
                rol,
                cooperativaId = usuario.CooperativaId,
                cooperativa = usuario.Cooperativa?.Nombre
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

public sealed class RegisterRequest
{
    public string? NombreCompleto { get; init; }
    public string? Telefono { get; init; }
    public string? Correo { get; init; }
    public string? Password { get; init; }
    public Guid CooperativaId { get; init; }
    public bool ConsentimientoArco { get; init; }
}

public sealed class LoginRequest
{
    public string? Correo { get; init; }
    public string? Password { get; init; }
}

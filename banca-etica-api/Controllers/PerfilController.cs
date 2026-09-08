using System.Security.Claims;
using BCrypt.Net;
using banca_etica_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers;

[ApiController]
[Authorize]
[Route("api/perfil")]
public class PerfilController : ControllerBase
{
    private readonly AppDbContext _context;
    public PerfilController(AppDbContext context) => _context = context;

    [HttpGet("me")]
    public async Task<IActionResult> Consultar()
    {
        var usuario = await UsuarioActual();
        return Ok(Respuesta(usuario));
    }

    [HttpPut("me")]
    public async Task<IActionResult> Actualizar(ActualizarPerfilRequest request)
    {
        var usuario = await UsuarioActual();
        var correo = request.Correo?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(request.Telefono)) return BadRequest(new { mensaje = "Correo y teléfono son obligatorios." });
        if (await _context.Usuarios.AnyAsync(u => u.Correo == correo && u.Id != usuario.Id)) return Conflict(new { mensaje = "Ese correo ya está registrado." });
        usuario.Correo = correo;
        usuario.Telefono = request.Telefono.Trim();
        usuario.ConsentimientoArco = request.ConsentimientosArco;
        if (!string.IsNullOrWhiteSpace(request.NuevaPassword)) usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaPassword);
        await _context.SaveChangesAsync();
        return Ok(Respuesta(usuario));
    }

    private async Task<Models.Usuario> UsuarioActual() => await _context.Usuarios.Include(u => u.Rol).SingleAsync(u => u.Id == Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!));
    private static object Respuesta(Models.Usuario u) => new { id = u.Id, nombreCompleto = $"{u.Nombres} {u.ApellidoPaterno} {u.ApellidoMaterno}".Trim(), telefono = u.Telefono ?? "", correo = u.Correo, estatusMembresia = u.Estatus == "ACTIVO" ? "Activo" : u.Estatus, consentimientosArco = u.ConsentimientoArco, umbralAlertaSaldo = 0m, rolId = u.RolId };
}

public sealed class ActualizarPerfilRequest { public string? Correo { get; init; } public string? Telefono { get; init; } public bool ConsentimientosArco { get; init; } public string? NuevaPassword { get; init; } }

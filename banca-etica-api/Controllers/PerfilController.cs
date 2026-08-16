using Microsoft.AspNetCore.Mvc;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System;
using System.Linq;

namespace banca_etica_api.Controllers
{
    [ApiController]
    public class PerfilController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PerfilController(AppDbContext context)
        {
            _context = context;
        }

        // Definimos la ruta absoluta directamente en el HttpGet
        [HttpGet("api/perfil/me")]
        public async Task<IActionResult> ObtenerMiPerfil()
        {
            // 1. Intentamos obtener el ID del usuario desde las Claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value 
                           ?? User.FindFirst("id")?.Value;

            // SI ESTÁS PROBANDO SIN JWT AÚN:
            // Puedes hardcodear temporalmente un ID real de tu BD para comprobar que la ruta ya responde:
            // userIdClaim = "AQUÍ_UN_GUID_REAL_DE_TU_BD";

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid usuarioId))
            {
                return Unauthorized(new { mensaje = "No se encontró un ID de usuario válido en la sesión." });
            }

            var usuario = await _context.Usuarios
                .Where(u => u.Id == usuarioId)
                .Select(u => new 
                {
                    id = u.Id,
                    nombreCompleto = u.NombreCompleto,
                    telefono = u.Telefono,
                    correo = u.Correo,
                    estatusMembresia = u.EstatusMembresia,
                    consentimientosArco = u.ConsentimientosArco,
                    umbralAlertaSaldo = u.UmbralAlertaSaldo,
                    rolId = u.RolId
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
            {
                return NotFound(new { mensaje = $"El usuario con ID {usuarioId} no existe en la base de datos." });
            }

            return Ok(usuario);
        }

        [HttpPut("api/perfil/me")]
        public async Task<IActionResult> ActualizarMiPerfil([FromBody] ActualizarMiPerfilRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value 
                           ?? User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid usuarioId))
            {
                return Unauthorized(new { mensaje = "No se encontró un ID de usuario válido en la sesión." });
            }

            var usuario = await _context.Usuarios.FindAsync(usuarioId);
            if (usuario == null)
            {
                return NotFound(new { mensaje = "Usuario no encontrado." });
            }

            usuario.Telefono = request.Telefono;
            usuario.Correo = request.Correo;
            usuario.UmbralAlertaSaldo = request.UmbralAlertaSaldo;
            usuario.ConsentimientosArco = request.ConsentimientosArco;

            if (!string.IsNullOrEmpty(request.NuevaPassword))
            {
                usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaPassword);
            }

            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Perfil actualizado correctamente." });
        }
    }
}
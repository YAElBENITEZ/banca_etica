using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using System.Threading.Tasks;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System;

namespace banca_etica_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // 1. Validar campos requeridos
            if (string.IsNullOrEmpty(request.Correo) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { mensaje = "El correo y la contraseña son obligatorios." });
            }

            // 2. Buscar usuario en la BD incluyendo su Rol
            var usuario = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.Correo == request.Correo);

            if (usuario == null)
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
            }

            // 3. Verificar contraseña cifrada con BCrypt
            bool passwordValido = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);
            if (!passwordValido)
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
            }

            // 4. Crear los Claims para el JWT (ID, Correo y Rol)
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Email, usuario.Correo),
                new Claim(ClaimTypes.Role, usuario.Rol?.Nombre ?? "Socio")
            };

            // 5. Firmar el Token JWT (Usa la misma clave que configuraste en Program.cs)
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SuperClaveSecretaBancaEtica2026_ClaveLargaYSegura"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "banca-etica-api",
                audience: "banca-etica-app",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7), // Duración de 7 días
                signingCredentials: creds
            );

            string jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

            // 6. Retornar token y datos básicos
            return Ok(new 
            { 
                mensaje = "Inicio de sesión exitoso",
                token = jwtToken,
                usuario = new 
                {
                    id = usuario.Id,
                    nombre = usuario.NombreCompleto,
                    correo = usuario.Correo,
                    rol = usuario.Rol?.Nombre ?? "Socio"
                }
            });
        }
    }
}
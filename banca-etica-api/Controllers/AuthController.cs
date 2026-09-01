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
        private static readonly Guid SuperAdminRolId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // 1. Validar campos
            if (string.IsNullOrEmpty(request.NombreCompleto) || 
                string.IsNullOrEmpty(request.Correo) || 
                string.IsNullOrEmpty(request.Telefono) || 
                string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { mensaje = "Todos los campos son obligatorios." });
            }

            // 2. Verificar si el correo ya existe
            var existeCorreo = await _context.Usuarios.AnyAsync(u => u.Correo == request.Correo);
            if (existeCorreo)
            {
                return BadRequest(new { mensaje = "El correo electrónico ya está registrado." });
            }

            // 3. Hashear la contraseña
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 4. Crear el usuario
            var usuario = new Usuario
            {
                Id = Guid.NewGuid(),
                NombreCompleto = request.NombreCompleto,
                Telefono = request.Telefono,
                Correo = request.Correo,
                PasswordHash = hashedPassword,
                RolId = request.RolId,
                EstatusMembresia = "Activo",
                FechaAfiliacion = DateTime.UtcNow,
                ConsentimientosArco = true,
                UmbralAlertaSaldo = 0
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                mensaje = "Usuario registrado exitosamente.",
                usuarioId = usuario.Id 
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Correo) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { mensaje = "El correo y la contraseña son obligatorios." });
            }

            var usuario = await _context.Usuarios
                .Include(u => u.Rol)
                .Include(u => u.Comunidad)
                .FirstOrDefaultAsync(u => u.Correo == request.Correo);

            if (usuario == null)
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
            }

            bool passwordValido = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);
            if (!passwordValido)
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
            }

            // 4. Validación: Solo SuperAdmin puede ingresar sin comunidad
            bool esSuperAdmin = usuario.RolId == SuperAdminRolId;
            if (!esSuperAdmin && usuario.ComunidadId == null)
            {
                return Unauthorized(new { mensaje = "Tu cuenta no está asignada a ninguna comunidad. Contacta al administrador." });
            }

            // 5. Crear los Claims para el JWT
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Email, usuario.Correo),
                new Claim(ClaimTypes.Role, usuario.Rol?.Nombre ?? "Socio"),
                new Claim("ComunidadId", usuario.ComunidadId?.ToString() ?? string.Empty)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SuperClaveSecretaBancaEtica2026_ClaveLargaYSegura"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "banca-etica-api",
                audience: "banca-etica-app",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            string jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new 
            { 
                mensaje = "Inicio de sesión exitoso",
                token = jwtToken,
                usuario = new 
                {
                    id = usuario.Id,
                    nombre = usuario.NombreCompleto,
                    correo = usuario.Correo,
                    rol = usuario.Rol?.Nombre ?? "Socio",
                    comunidadId = usuario.ComunidadId,
                    comunidadNombre = usuario.Comunidad?.Nombre ?? null
                }
            });
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System;
using BCrypt.Net;

namespace banca_etica_api.Controllers
{
    // Exige Token JWT válido y limita la ruta base para la administración
    [Authorize]
    [Route("api/admin/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuarioController(AppDbContext context)
        {
            _context = context;
        }

        // Solo Administradores pueden registrar nuevos usuarios en el sistema
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CrearUsuario([FromBody] UsuarioRequest request)
        {
            // 1. Validaciones básicas en código (Complementa las Data Annotations del DTO)
            if (string.IsNullOrEmpty(request.NombreCompleto) || 
                string.IsNullOrEmpty(request.Telefono) || 
                string.IsNullOrEmpty(request.Correo) || 
                string.IsNullOrEmpty(request.EstatusMembresia) ||
                string.IsNullOrEmpty(request.PasswordHash))
            {
                return BadRequest(new { mensaje = "El nombre, teléfono, correo, contraseña y estatus son obligatorios." });
            }

            // 2. Validación de integridad 1: Verificar que el RolId realmente exista en el catálogo de BD
            bool existeRol = await _context.Roles.AnyAsync(r => r.Id == request.RolId);
            if (!existeRol)
            {
                return BadRequest(new { mensaje = "El RolId proporcionado no es válido o no existe en la base de datos." });
            }

            // 3. Validación de integridad 2: Prevenir correos duplicados
            bool existeCorreo = await _context.Usuarios.AnyAsync(u => u.Correo == request.Correo);
            if (existeCorreo)
            {
                return BadRequest(new { mensaje = "El correo electrónico ya se encuentra registrado." });
            }

            // 4. Encriptación segura de contraseña usando BCrypt
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.PasswordHash);

            // 5. Instanciar la entidad Usuario
            var nuevoUsuario = new Usuario
            {
                Id = Guid.NewGuid(),
                NombreCompleto = request.NombreCompleto,
                Telefono = request.Telefono, 
                Correo = request.Correo,
                EstatusMembresia = request.EstatusMembresia,
                ConsentimientosArco = request.ConsentimientosArco,
                UmbralAlertaSaldo = request.UmbralAlertaSaldo,
                PasswordHash = hashedPassword,
                FechaAfiliacion = DateTime.UtcNow, 
                RolId = request.RolId,
                
                // INICIALIZACIÓN AUTOMÁTICA: Crea su cajita de ahorro base en ceros de forma nativa
                Cajitas = new System.Collections.Generic.List<Cajita>
                {
                    new Cajita
                    {
                        Id = Guid.NewGuid(),
                        Nombre = "Caja Principal",
                        SaldoActual = 0.00m,
                        Meta = 0.00m,
                        Proyeccion612Meses = 0.00m,
                        PorcentajeAportacionFondo = 10.00m,
                        EstadoSync = "Sincronizado"
                    }
                }
            };

            // 6. Impactar cambios en la Base de Datos
            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync(); 

            return CreatedAtAction(nameof(ObtenerUsuarioPorId), new { id = nuevoUsuario.Id }, new 
            { 
                mensaje = "Usuario y caja principal creados exitosamente.",
                id = nuevoUsuario.Id,
                correo = nuevoUsuario.Correo
            });
        }

        // Obtener lista global de socios/usuarios
        [Authorize(Roles = "Admin,Tesorero,Consejo")]
        [HttpGet]
        public async Task<IActionResult> ObtenerUsuarios()
        {
            var usuarios = await _context.Usuarios
                .Include(u => u.Rol)
                .Select(u => new 
                {
                    id = u.Id,
                    nombreCompleto = u.NombreCompleto,
                    telefono = u.Telefono,
                    correo = u.Correo,
                    estatusMembresia = u.EstatusMembresia,
                    consentimientosArco = u.ConsentimientosArco,
                    umbralAlertaSaldo = u.UmbralAlertaSaldo,
                    rolId = u.RolId,
                    rolNombre = u.Rol.Nombre,
                    fechaAfiliacion = u.FechaAfiliacion
                })
                .ToListAsync();

            return Ok(usuarios);
        }

        // Consultar detalle de un usuario específico por ID (Útil para reuso con CreatedAtAction)
        [Authorize(Roles = "Admin,Tesorero")]
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerUsuarioPorId(Guid id)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.Rol)
                .Where(u => u.Id == id)
                .Select(u => new 
                {
                    id = u.Id,
                    nombreCompleto = u.NombreCompleto,
                    telefono = u.Telefono,
                    correo = u.Correo,
                    estatusMembresia = u.EstatusMembresia,
                    consentimientosArco = u.ConsentimientosArco,
                    umbralAlertaSaldo = u.UmbralAlertaSaldo,
                    rolId = u.RolId,
                    rolNombre = u.Rol.Nombre
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
            {
                return NotFound(new { mensaje = "El usuario solicitado no existe." });
            }

            return Ok(usuario);
        }
    }
}
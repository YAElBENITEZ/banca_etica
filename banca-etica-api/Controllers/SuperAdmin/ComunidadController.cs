using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System;
using BCrypt.Net;

namespace banca_etica_api.Controllers.SuperAdmin
{   
    [Authorize] 
    [Route("api/superadmin/[controller]")]
    [ApiController]
    public class ComunidadController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ComunidadController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/superadmin/comunidad
        [Authorize(Roles = "SuperAdmin")]
        [HttpGet]
        public async Task<IActionResult> ObtenerComunidades()
        {
            var comunidades = await _context.Comunidades
                .Select(c => new 
                {
                    c.Id,
                    c.Nombre,
                    c.Descripcion,
                    c.Municipio,
                    c.Estado,
                    TotalUsuarios = c.Usuarios.Count
                })
                .ToListAsync();

            return Ok(comunidades);
        }

        // POST: api/superadmin/comunidad (Crear)
        [Authorize(Roles = "SuperAdmin")]
        [HttpPost]
        public async Task<IActionResult> CrearComunidad([FromBody] ComunidadRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Municipio) || string.IsNullOrWhiteSpace(request.Estado))
            {
                return BadRequest(new { mensaje = "El nombre, municipio y estado son obligatorios." });
            }

            var nuevaComunidad = new Comunidad
            {
                Id = Guid.NewGuid(),
                Nombre = request.Nombre,
                Descripcion = request.Descripcion ?? string.Empty,
                Municipio = request.Municipio,
                Estado = request.Estado
            };

            _context.Comunidades.Add(nuevaComunidad);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Comunidad creada exitosamente.", comunidad = nuevaComunidad });
        }

        // PUT: api/superadmin/comunidad/{id} (Editar)
        [Authorize(Roles = "SuperAdmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarComunidad(Guid id, [FromBody] ComunidadRequest request)
        {
            var comunidad = await _context.Comunidades.FindAsync(id);
            if (comunidad == null)
            {
                return NotFound(new { mensaje = "La comunidad no existe." });
            }

            comunidad.Nombre = request.Nombre;
            comunidad.Descripcion = request.Descripcion ?? string.Empty;
            comunidad.Municipio = request.Municipio;
            comunidad.Estado = request.Estado;

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Comunidad actualizada correctamente." });
        }

        // POST: api/superadmin/comunidad/usuario
        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("usuario")]
        public async Task<IActionResult> AgregarUsuarioAComunidad([FromBody] UsuarioRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existeCorreo = await _context.Usuarios.AnyAsync(u => u.Correo == request.Correo);
            if (existeCorreo)
            {
                return BadRequest(new { mensaje = "El correo ya se encuentra registrado." });
            }

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.PasswordHash);

            var nuevoUsuario = new Usuario
            {
                Id = Guid.NewGuid(),
                NombreCompleto = request.NombreCompleto,
                Telefono = request.Telefono,
                Correo = request.Correo,
                PasswordHash = hashedPassword,
                RolId = request.RolId,
                ComunidadId = request.ComunidadId,
                EstatusMembresia = request.EstatusMembresia,
                FechaAfiliacion = DateTime.UtcNow,
                ConsentimientosArco = request.ConsentimientosArco,
                UmbralAlertaSaldo = request.UmbralAlertaSaldo
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Usuario registrado exitosamente en la comunidad." });
        }
    }
}
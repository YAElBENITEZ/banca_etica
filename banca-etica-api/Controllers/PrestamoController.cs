using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System;
using System.Security.Claims;

namespace banca_etica_api.Controllers
{
    // CANDADO A NIVEL CONTROLADOR: Exige un JWT válido para cualquier endpoint
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PrestamoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PrestamoController(AppDbContext context)
        {
            _context = context;
        }

        // 🟢 HTTP POST: Crear préstamo personal asociado al usuario autenticado
        [HttpPost]
        public async Task<IActionResult> CrearPrestamo([FromBody] PrestamoRequest request)
        {
            // 1. Extraer el ID del usuario del Token JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid usuarioId))
            {
                return Unauthorized(new { mensaje = "Token de usuario inválido o no proporcionado." });
            }

            // 2. Validaciones básicas
            if (string.IsNullOrEmpty(request.Nombre) || request.MontoAprobado <= 0 || 
                string.IsNullOrEmpty(request.Estado) || request.TasaInteresAplicada <= 0 || 
                request.PlazoMeses <= 0 )
            {
                return BadRequest(new { mensaje = "El nombre, monto, tasa de interés, plazo y estado son obligatorios." });
            }

            // 3. Crear entidad asignando UsuarioId y EsColectivo = false
            var nuevoPrestamo = new Prestamo
            {
                Id = Guid.NewGuid(),
                UsuarioId = usuarioId, // <-- Asignación automática de identidad
                Nombre = request.Nombre,
                Tipo = request.Tipo,
                MontoAprobado = request.MontoAprobado, 
                PlazoMeses = request.PlazoMeses,
                Estado = request.Estado,
                TasaInteresAplicada = request.TasaInteresAplicada,
                TipoInteres = request.TipoInteres,
                EsColectivo = false, // Préstamo individual
                FechaDesembolso = request.FechaDesembolso.UtcDateTime, 
                CajitaId = request.CajitaId
            };
        
            _context.Prestamos.Add(nuevoPrestamo);
            await _context.SaveChangesAsync(); 
        
            return Ok(new 
            { 
                mensaje = "Préstamo registrado exitosamente",
                id = nuevoPrestamo.Id
            });
        }

        // 🟢 HTTP GET: Obtener préstamos del socio autenticado
        [HttpGet]
        public async Task<IActionResult> ObtenerPrestamos()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid usuarioId))
            {
                return Unauthorized(new { mensaje = "No se pudo recuperar la identidad del usuario." });
            }

            var prestamos = await _context.Prestamos
                .Where(p => p.UsuarioId == usuarioId && p.EsColectivo == false)
                .Select(p => new 
                {
                    id = p.Id,
                    proposito = p.Nombre,
                    tipo = p.Tipo,
                    montoOriginal = p.MontoAprobado,
                    tasa = p.TasaInteresAplicada,
                    plazoMeses = p.PlazoMeses, 
                    tipoInteres = p.TipoInteres,
                    estado = p.Estado,
                    fechaDesembolso = p.FechaDesembolso,
                    cajitaNombre = p.Cajita.Nombre 
                })
                .ToListAsync();

            return Ok(prestamos);
        }
    }
}
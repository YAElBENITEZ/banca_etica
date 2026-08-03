using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System;
using System.Security.Claims; // <-- OBLIGATORIO: Para leer las Claims del JWT

namespace banca_etica_api.Controllers
{   
    // 🛡️ Exige Token JWT válido para todo el controlador
    [Authorize] 
    [Route("api/[controller]")]
    [ApiController]
    public class CajitaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CajitaController(AppDbContext context)
        {
            _context = context;
        }

        // 🟢 HTTP POST: Crear cajita asociada automáticamente al usuario autenticado
        [HttpPost]
        public async Task<IActionResult> CrearCajita([FromBody] CajitaRequest request)
        {
            // Validaciones básicas
            if (string.IsNullOrEmpty(request.Nombre) || request.Meta <= 0)
            {
                return BadRequest(new { mensaje = "El nombre y la meta son obligatorios." });
            }

            // 🔑 EXTRAER EL ID DEL USUARIO DESDE EL TOKEN JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid usuarioId))
            {
                return Unauthorized(new { mensaje = "Token de usuario inválido o no proporcionado." });
            }
        
            var nuevaCajita = new Cajita
            {
                Id = Guid.NewGuid(),
                UsuarioId = usuarioId, // <-- Se asigna automáticamente al usuario logueado
                Nombre = request.Nombre,
                Meta = request.Meta, 
                Proyeccion612Meses = request.Meta, 
                SaldoActual = 0.00m,
                PorcentajeAportacionFondo = 10.00m,
                EstadoSync = "Sincronizado"
            };
        
            _context.Cajitas.Add(nuevaCajita);
            await _context.SaveChangesAsync();
        
            return Ok(new 
            { 
                mensaje = "Caja creada exitosamente", 
                cajitaId = nuevaCajita.Id 
            });
        }

        // 🟢 HTTP GET: Obtener ÚNICAMENTE las cajitas del usuario logueado
        [HttpGet]
        public async Task<IActionResult> ObtenerCajitas()
        {
            // 1. Extraemos el ID del socio autenticado a partir del Token JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid usuarioId))
            {
                return Unauthorized(new { mensaje = "No se pudo recuperar la identidad del usuario." });
            }

            // 2. Filtramos en SQL para traer SOLO las cajitas de este usuarioID
            var cajitas = await _context.Cajitas
                .Where(c => c.UsuarioId == usuarioId && c.EsColectiva == false)
                .Select(c => new 
                {
                    id = c.Id,
                    nombre = c.Nombre,
                    saldoActual = c.SaldoActual,
                    meta = c.Meta,
                    proyeccion612Meses = c.Proyeccion612Meses,
                    porcentajeAportacionFondo = c.PorcentajeAportacionFondo,
                    estadoSync = c.EstadoSync
                })
                .ToListAsync();

            // 3. Devolvemos el array filtrado
            return Ok(cajitas);
        }
    }
}
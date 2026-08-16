using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization; // Libreria de autorización
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System;

namespace banca_etica_api.Controllers.Admin
{   
    [Authorize] 
    [Route("api/admin/[controller]")]
    [ApiController]
    public class CajitaController : ControllerBase
    {
        private readonly AppDbContext _context;

        // 1. El constructor debe llamarse EXACTAMENTE igual que la clase
        public CajitaController(AppDbContext context)
        {
            _context = context;
        }

        // 2. Este endpoint responderá a POST: http://localhost:5026/api/admin/cajita
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CrearCajita([FromBody] CajitaRequest request)
        {
            // Validaciones básicas
            if (string.IsNullOrEmpty(request.Nombre) || request.Meta <= 0)
            {
                return BadRequest(new { mensaje = "El nombre y el monto son obligatorios." });
            }
        
            // 3. Armamos la entidad Cajita para la Base de Datos
            var nuevaCajita = new Cajita
            {
                Id = Guid.NewGuid(),
                UsuarioId = request.UsuarioId, 
                Nombre = request.Nombre,
                
                // ¡ESTA ES LA LÍNEA MÁGICA QUE FALTABA!
                Meta = request.Meta, 
                EsColectiva = request.EsColectiva, 
                // (Opcional) Si ya no vas a usar Proyeccion612Meses en tu app, 
                // puedes borrarla de tu modelo después. Por ahora le pasamos la Meta también.
                Proyeccion612Meses = request.Meta, 
                
                SaldoActual = 0.00m,
                PorcentajeAportacionFondo = 10.00m,
                EstadoSync = "Sincronizado"
            };
        
            // 4. Guardamos en PostgreSQL
            _context.Cajitas.Add(nuevaCajita);
            await _context.SaveChangesAsync();
        
            return Ok(new 
            { 
                mensaje = "Caja creada exitosamente", 
                cajitaId = nuevaCajita.Id 
            });
        }

        // 1. Especificamos que este endpoint responderá a una petición GET
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> ObtenerCajitas()
        {
            // 2. Vamos a la base de datos y traemos todas las cajitas en forma de lista
            // (Asegúrate de tener: using Microsoft.EntityFrameworkCore; hasta arriba de tu archivo)
            var cajitas = await _context.Cajitas
                .Where(c => c.EsColectiva)
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

            // 3. Las devolvemos con un status 200 OK
            return Ok(cajitas);
        }
    }
}
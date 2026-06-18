using Microsoft.AspNetCore.Mvc;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System;

namespace banca_etica_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrestamoController : ControllerBase
    {
        private readonly AppDbContext _context;

        // 1. El constructor debe llamarse EXACTAMENTE igual que la clase
        public PrestamoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CrearPrestamo([FromBody] PrestamoRequest request)
        {
            // Validaciones básicas
            if (string.IsNullOrEmpty(request.Nombre) || request.MontoAprobado <= 0 || string.IsNullOrEmpty(request.Estado) || request.TasaInteresAplicada <= 0 || request.PlazoMeses <= 0 )
            {
                return BadRequest(new { mensaje = "El tipo de nombre, monto, tasa de interes, plazo, y el estado son obligatorios." });
            }

            DateTimeOffset timestamp = DateTimeOffset.Now;

        
            // 3. Armamos el recibo para la Base de Datos
            var nuevoPrestamo = new Prestamo
            {
                Id = Guid.NewGuid(),
                Nombre = request.Nombre,
                MontoAprobado = request.MontoAprobado, 
                PlazoMeses = request.PlazoMeses,
                Estado = request.Estado,
                TasaInteresAplicada = request.TasaInteresAplicada, // ¡Agregamos la tasa!
                TipoInteres = request.TipoInteres,
                // ¡Magia anti-PostgreSQL! Aseguramos que la fecha se guarde en UTC Universal
                FechaDesembolso = request.FechaDesembolso.UtcDateTime, 
                
                CajitaId = request.CajitaId
            };
        
            // 4. Guardamos AMBAS cosas: El nuevo recibo y el nuevo saldo de la cajita
            _context.Prestamos.Add(nuevoPrestamo);
            await _context.SaveChangesAsync(); 
        
            return Ok(new 
            { 
                mensaje = "Transacción creada exitosamente",
            });
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPrestamos()
        {
            // Hacemos una "proyección". Le decimos a SQL exactamente qué columnas queremos.
            var prestamos = await _context.Prestamos
                .Select(p => new 
                {
                    id = p.Id,
                    proposito = p.Nombre,
                    montoOriginal = p.MontoAprobado,
                    tasa = p.TasaInteresAplicada,
                    plazoMeses = p.PlazoMeses, 
                    tipoInteres = p.TipoInteres,
                    estado = p.Estado,
                    fechaDesembolso = p.FechaDesembolso,
                    
                    // ¡LA MAGIA! Navegamos hacia la Cajita y sacamos solo su nombre
                    cajitaNombre = p.Cajita.Nombre 
                })
                .ToListAsync();

            return Ok(prestamos);
        }
    }
}
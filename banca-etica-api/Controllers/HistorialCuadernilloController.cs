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
    public class HistorialCuadernilloController : ControllerBase
    {
        private readonly AppDbContext _context;

        // 1. El constructor debe llamarse EXACTAMENTE igual que la clase
        public HistorialCuadernilloController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CrearNuevoMovimiento([FromBody] HistorialCuadernilloRequest request)
        {
            // Validaciones básicas
            if (string.IsNullOrEmpty(request.TipoMovimiento) || request.Monto <= 0 || string.IsNullOrEmpty(request.FirmaTesorero))
            {
                return BadRequest(new { mensaje = "El tipo de movimiento, monto y firma del tesorero son obligatorios." });
            }

            // 1. Buscamos la cajita original en la base de datos para ver cuánto dinero tiene HOY
            var cajita = await _context.Cajitas.FindAsync(request.CajitaId);
            if (cajita == null) 
            {
                return NotFound(new { mensaje = "Cajita no encontrada." });
            }

            // 2. Lógica Contable y Prevención de Quiebra (Números negativos)
            if (request.TipoMovimiento == "Abono") 
            {
                cajita.SaldoActual += request.Monto;
            } 
            else if (request.TipoMovimiento == "Retiro") 
            {
                if (cajita.SaldoActual < request.Monto) 
                {
                    return BadRequest(new { mensaje = "Fondos insuficientes para realizar este retiro." });
                }
                cajita.SaldoActual -= request.Monto;
            }

            DateTimeOffset timestamp = DateTimeOffset.Now;
        
            // 3. Armamos el recibo para la Base de Datos
            var nuevoMovimiento = new HistorialCuadernillo
            {
                Id = Guid.NewGuid(),
                CajitaId = request.CajitaId, 
                Monto = request.Monto,
                FirmaTesorero = request.FirmaTesorero, 
                TipoMovimiento = request.TipoMovimiento, 
                
                // ¡LA CORRECCIÓN ESTÁ AQUÍ! Usamos DateTime.UtcNow
                Fecha = DateTime.UtcNow, 
                
                SaldoAcumulado = cajita.SaldoActual, 
                
                // ¡AQUÍ TAMBIÉN!
                TimestampAuditoria = DateTime.UtcNow, 
                
                DeviceIdOrigen = "Web_Frontend"
            };
        
            // 4. Guardamos AMBAS cosas: El nuevo recibo y el nuevo saldo de la cajita
            _context.Historiales.Add(nuevoMovimiento);
            await _context.SaveChangesAsync(); 
        
            return Ok(new 
            { 
                mensaje = "Transacción creada exitosamente", 
                movimientoId = nuevoMovimiento.Id,
                nuevoSaldo = cajita.SaldoActual
            });
        }
    }
}
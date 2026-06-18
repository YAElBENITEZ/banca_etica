using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using banca_etica_api.Data;
using banca_etica_api.DTOs;
using banca_etica_api.Models;
using System.Threading.Tasks;
using BCrypt.Net;
// Asegúrate de importar Bcrypt si tu editor no lo hace automático
// usando BCrypt.Net; 

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
            // 1. Buscamos al usuario por correo
            var usuario = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.Correo == request.Correo);

            if (usuario == null)
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
            }

            // 2. ¡LA MAGIA DE BCRYPT!
            // Comparamos el texto plano (request.Password) contra el hash de la BD (usuario.PasswordHash)
            bool passwordValido = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);

            if (!passwordValido)
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
            }
            
            // 3. Respuesta exitosa (Después aquí meteremos un JWT)
            return Ok(new 
            { 
                mensaje = "Inicio de sesión exitoso",
                usuarioId = usuario.Id,
                nombre = usuario.NombreCompleto,
                rol = usuario.Rol.Nombre 
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // 1. Validación de negocio: Verificar si el correo ya está registrado
            bool correoExiste = await _context.Usuarios.AnyAsync(u => u.Correo == request.Correo);
            if (correoExiste)
            {
                return BadRequest(new { mensaje = "El correo electrónico ya se encuentra registrado." });
            }

            // 2. Validación de gobernanza: Verificar que el RolId proporcionado exista en el catálogo
            bool rolExiste = await _context.Roles.AnyAsync(r => r.Id == request.RolId);
            if (!rolExiste)
            {
                return BadRequest(new { mensaje = "El rol seleccionado no es válido." });
            }

            // 3. ¡LECCIÓN DE LARAVEL A C#! Encriptamos la contraseña usando BCrypt
            // Esto equivale a Hash::make()
            string passwordHashCardon = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 4. Creamos la entidad Usuario con sus campos base
            var nuevoUsuario = new Usuario
            {
                Id = Guid.NewGuid(),
                NombreCompleto = request.NombreCompleto,
                Telefono = request.Telefono,
                Correo = request.Correo,
                PasswordHash = passwordHashCardon,
                RolId = request.RolId,
                EstatusMembresia = "Activo", // Por defecto entran activos
                ConsentimientosArco = true,  // Validado en los términos de React
                UmbralAlertaSaldo = 500,     // Alerta base de ejemplo para la billetera
                FechaAfiliacion = DateTime.UtcNow
            };

            // 5. APORTACIÓN DE ARQUITECTURA: Inicialización automática de las Cajitas
            // Todo socio nuevo necesita su cuenta de ahorro lista en ceros metida en su nueva lista
            nuevoUsuario.Cajitas = new List<Cajita>
            {
                new Cajita
                {
                    Id = Guid.NewGuid(),
                    Nombre = "Mi Primera Caja", // Le ponemos un nombre por defecto
                    SaldoActual = 0.00m,
                    Meta = 0.00m,               // Agregamos el campo Meta que creamos hace rato
                    Proyeccion612Meses = 0.00m,
                    PorcentajeAportacionFondo = 10.00m, // Porcentaje comunitario base por reglamento
                    EstadoSync = "Sincronizado"
                }
            };

            // 6. Impactar la Base de Datos
            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync(); // Guarda al Usuario y a la Cajita al mismo tiempo de forma segura

            return CreatedAtAction(nameof(Login), new { id = nuevoUsuario.Id }, new 
            {
                mensaje = "Usuario y cajita de ahorro registrados exitosamente.",
                usuarioId = nuevoUsuario.Id,
                correo = nuevoUsuario.Correo
            });
        }
    }
}
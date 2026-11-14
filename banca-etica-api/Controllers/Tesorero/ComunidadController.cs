using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using banca_etica_api.Data;
using banca_etica_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Tesorero;

[ApiController]
[Authorize(Roles = "Tesorero")]
[Route("api/tesorero/comunidad")]
public class ComunidadController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    // 1. Inyectamos DbContext y FileStorageService
    public ComunidadController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<IActionResult> GetComunidadUserData([FromQuery] string? tipo)
    {
        var tesoreroId = ObtenerUsuarioId();
        if (tesoreroId == Guid.Empty)
            return Unauthorized(new { mensaje = "Token inválido o sesión no identificada." });

        var usuarioTesorero = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == tesoreroId);
        
        if (usuarioTesorero?.CooperativaId == null)
            return BadRequest(new { mensaje = "El usuario no tiene una cooperativa asignada." });
        
        var cooperativaId = usuarioTesorero.CooperativaId.Value;

        var query = _context.Usuarios
            .AsNoTracking()
            .Include(u => u.Rol)
            .Include(u => u.Documentos)
            .Where(u => u.CooperativaId == cooperativaId && u.Rol.Nombre == "SOCIO");

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            var tipoLimpio = tipo.Trim().ToUpperInvariant();
            query = query.Where(u => u.Estatus == tipoLimpio);
        }

        var socios = await query
            .OrderByDescending(u => u.FechaRegistro)
            .Select(u => new
            {
                id = u.Id,
                numeroSocio = u.NumeroSocio,
                nombres = u.Nombres,
                apellidoPaterno = u.ApellidoPaterno,
                apellidoMaterno = u.ApellidoMaterno,
                correo = u.Correo,
                telefono = u.Telefono,
                estatus = u.Estatus,
                fechaRegistro = u.FechaRegistro,
                documentos = u.Documentos.Select(d => new
                {
                    id = d.Id,
                    tipo = d.Tipo,
                    url = d.Url
                }).ToList()
            })
            .ToListAsync();

        return Ok(socios);
    }

    // NUEVO ENDPOINT: El Tesorero descarga/visualiza el archivo desde Google Drive
    [HttpGet("documentos/{documentoId:guid}/ver")]
    public async Task<IActionResult> VerDocumento(Guid documentoId)
    {
        var tesoreroId = ObtenerUsuarioId();
        var tesorero = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == tesoreroId);

        if (tesorero?.CooperativaId == null)
            return Unauthorized(new { mensaje = "Tesorero no autorizado." });

        // Buscamos el documento asegurando que pertenezca a un socio de su cooperativa
        var documento = await _context.Documentos
            .Include(d => d.Socio)
            .FirstOrDefaultAsync(d => d.Id == documentoId && d.Socio.CooperativaId == tesorero.CooperativaId);

        if (documento is null)
            return NotFound(new { mensaje = "Documento no encontrado o no pertenece a tu cooperativa." });

        if (string.IsNullOrWhiteSpace(documento.Url))
            return BadRequest(new { mensaje = "El documento no cuenta con un File ID de Google Drive." });

        // Descargar bytes desde Google Drive
        var (stream, contentType, fileName) = await _fileStorage.ObtenerDocumentoAsync(documento.Url);

        // inline permite que el navegador lo muestre en pantalla (PDF o imagen)
        Response.Headers.Append("Content-Disposition", $"inline; filename=\"{fileName}\"");
        return File(stream, contentType);
    }

    [HttpPatch("{id:guid}/estatus")]
    public async Task<IActionResult> CambiarEstatusSocio(Guid id, [FromBody] CambiarEstatusDto dto)
    {
        var tesoreroId = ObtenerUsuarioId();
        var tesorero = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == tesoreroId);

        if (tesorero?.CooperativaId == null)
            return BadRequest(new { mensaje = "Tesorero sin cooperativa asignada." });

        var nuevoEstatus = dto.Estatus?.Trim().ToUpperInvariant();
        if (nuevoEstatus != "ACTIVO" && nuevoEstatus != "INACTIVO")
            return BadRequest(new { mensaje = "Estatus no válido. Use ACTIVO o INACTIVO." });

        var socio = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id && u.CooperativaId == tesorero.CooperativaId);

        if (socio is null)
            return NotFound(new { mensaje = "Socio no encontrado en esta cooperativa." });

        socio.Estatus = nuevoEstatus;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = $"Socio actualizado a {nuevoEstatus} con éxito." });
    }

    private Guid ObtenerUsuarioId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }

    public class CambiarEstatusDto
    {
        public string Estatus { get; set; } = string.Empty;
    }
}
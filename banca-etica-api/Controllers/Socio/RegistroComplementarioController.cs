using System.Security.Claims;
using banca_etica_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace banca_etica_api.Controllers.Socio;

[ApiController]
[Route("api/socio/registro-complementario")]
[Authorize(Roles = "33333333-3333-3333-3333-333333333333,SOCIO,Socio")]
public class RegistroComplementarioController : ControllerBase
{
    private readonly AppDbContext _context;

    public RegistroComplementarioController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> Consultar()
    {
        var socio = await SocioActual();
        if (socio is null) return Unauthorized(new { mensaje = "Sesión no válida." });
        if (!string.Equals(socio.Estatus, "ACTIVO", StringComparison.OrdinalIgnoreCase))
            return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Este apartado estará disponible cuando Tesorería apruebe tu registro." });

        return Ok(Respuesta(socio));
    }

    [HttpPut]
    public async Task<IActionResult> Guardar([FromBody] RegistroComplementarioRequest request)
    {
        var socio = await SocioActual();
        if (socio is null) return Unauthorized(new { mensaje = "Sesión no válida." });
        if (!string.Equals(socio.Estatus, "ACTIVO", StringComparison.OrdinalIgnoreCase))
            return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Primero debe aprobarse tu solicitud de ingreso." });

        var curp = Limpiar(request.Curp);
        var rfc = Limpiar(request.Rfc);
        var beneficiario = request.NombreBeneficiario?.Trim();
        var tipoSocio = Limpiar(request.TipoSocio);

        if (string.IsNullOrWhiteSpace(curp) || string.IsNullOrWhiteSpace(rfc) || string.IsNullOrWhiteSpace(beneficiario) || string.IsNullOrWhiteSpace(tipoSocio))
            return BadRequest(new { mensaje = "CURP, RFC, nombre de beneficiario(a) y tipo de socio son obligatorios para concluir el registro." });
        if (curp.Length != 18)
            return BadRequest(new { mensaje = "La CURP debe tener 18 caracteres." });
        if (rfc.Length is < 12 or > 13)
            return BadRequest(new { mensaje = "El RFC debe tener 12 o 13 caracteres." });
        if (tipoSocio is not ("PRIMARIO" or "SECUNDARIO"))
            return BadRequest(new { mensaje = "Selecciona Socio primario o Socio secundario." });

        socio.Curp = curp;
        socio.Rfc = rfc;
        socio.NombreBeneficiario = beneficiario;
        socio.TipoSocio = tipoSocio;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Registro complementario guardado correctamente.", registro = Respuesta(socio) });
    }

    private async Task<Models.Usuario?> SocioActual()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(claim, out var id) ? await _context.Usuarios.SingleOrDefaultAsync(u => u.Id == id) : null;
    }

    private static string? Limpiar(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim().ToUpperInvariant();

    private static object Respuesta(Models.Usuario socio) => new
    {
        curp = socio.Curp ?? "",
        rfc = socio.Rfc ?? "",
        nombreBeneficiario = socio.NombreBeneficiario ?? "",
        tipoSocio = socio.TipoSocio ?? "",
        completo = !string.IsNullOrWhiteSpace(socio.Curp) && !string.IsNullOrWhiteSpace(socio.Rfc) && !string.IsNullOrWhiteSpace(socio.NombreBeneficiario) && !string.IsNullOrWhiteSpace(socio.TipoSocio)
    };
}

public sealed class RegistroComplementarioRequest
{
    public string? Curp { get; init; }
    public string? Rfc { get; init; }
    public string? NombreBeneficiario { get; init; }
    public string? TipoSocio { get; init; }
}

using System.ComponentModel.DataAnnotations;

namespace banca_etica_api.DTOs;

public sealed class CrearTesoreroRequest
{
    [Required(ErrorMessage = "El identificador del socio es obligatorio.")]
    public Guid SocioId { get; init; }

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "El formato de correo no es válido.")]
    public string Correo { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    public string Password { get; init; } = string.Empty;
}
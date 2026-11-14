using System.ComponentModel.DataAnnotations;

namespace banca_etica_api.DTOs;

public class CrearUsuarioDto
{
    [Required(ErrorMessage = "El rol es obligatorio.")]
    public Guid RolId { get; set; }

    public string? NumeroSocio { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100)]
    public string Nombres { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido paterno es obligatorio.")]
    [StringLength(100)]
    public string ApellidoPaterno { get; set; } = string.Empty;

    [StringLength(100)]
    public string? ApellidoMaterno { get; set; }

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "Formato de correo no válido.")]
    public string Correo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
    public string Password { get; set; } = string.Empty;

    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public bool ConsentimientoArco { get; set; } = true;
}
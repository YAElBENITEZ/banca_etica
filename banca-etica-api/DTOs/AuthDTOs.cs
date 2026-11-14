using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace banca_etica_api.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessage = "El código de la cooperativa es obligatorio.")]
    public string? CodigoCooperativa { get; set; }

    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    public string? NombreCompleto { get; set; }

    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    [Phone(ErrorMessage = "El formato del teléfono no es válido.")]
    public string? Telefono { get; set; }

    [Required(ErrorMessage = "El celular es obligatorio.")]
    [Phone(ErrorMessage = "El formato del celular no es válido.")]
    public string? Celular { get; set; }

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "El formato del correo no es válido.")]
    public string? Correo { get; set; }

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string? Password { get; set; }

    [Required(ErrorMessage = "Debe aceptar el consentimiento ARCO.")]
    public bool ConsentimientoArco { get; set; }
    
    [Required(ErrorMessage = "El INE es obligatorio.")]
    public IFormFile Ine { get; set; } = null!;

    [Required(ErrorMessage = "La CURP es obligatoria.")]
    public IFormFile Curp { get; set; } = null!;

    [Required(ErrorMessage = "El comprobante de domicilio es obligatorio.")]
    public IFormFile ComprobanteDomicilio { get; set; } = null!;
}

public class LoginRequest
{
    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "El formato del correo no es válido.")]
    public string? Correo { get; set; }

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string? Password { get; set; }
}

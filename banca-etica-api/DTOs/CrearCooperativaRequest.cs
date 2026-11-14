using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace banca_etica_api.DTOs;

public sealed class CrearCooperativaRequest
{
    [Required(ErrorMessage = "El nombre de la cooperativa es obligatorio.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 150 caracteres.")]
    public string Nombre { get; init; } = string.Empty;

    public IFormFile? Imagen { get; init; }
}
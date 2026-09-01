using System;
using System.ComponentModel.DataAnnotations;

namespace banca_etica_api.DTOs
{
    public class UsuarioRequest
    {
        [Required(ErrorMessage = "El nombre completo es obligatorio.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 100 caracteres.")]
        public string NombreCompleto { get; set; } = string.Empty;

        [Required(ErrorMessage = "El teléfono es obligatorio.")]
        [Phone(ErrorMessage = "El formato del teléfono no es válido.")]
        public string Telefono { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        public string Correo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El estatus de membresía es obligatorio.")]
        public string EstatusMembresia { get; set; } = string.Empty;

        public bool ConsentimientosArco { get; set; }

        [Range(0, 1000000, ErrorMessage = "El umbral de alerta debe estar entre 0 y 1,000,000.")]
        public decimal UmbralAlertaSaldo { get; set; }

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
        public string PasswordHash { get; set; } = string.Empty;

        [Required(ErrorMessage = "El RolId es obligatorio.")]
        public Guid RolId { get; set; }

        // Opcional para SuperAdmin / Requerido cuando se asigna a una comunidad
        public Guid? ComunidadId { get; set; }
    }
}
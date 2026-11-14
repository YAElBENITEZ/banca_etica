using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace banca_etica_api.Models
{
    public class Documento
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Tipo { get; set; } = string.Empty;

        [Required]
        public string Url { get; set; } = string.Empty;

        // Foreign Key
        public Guid SocioId { get; set; }

        // Propiedad de navegación explícita hacia Usuario
        [ForeignKey(nameof(SocioId))]
        public virtual Usuario Socio { get; set; } = null!;
    }
}
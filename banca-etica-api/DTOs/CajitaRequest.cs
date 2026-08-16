using System;
using System.ComponentModel.DataAnnotations;

namespace banca_etica_api.DTOs
{
    public class CajitaRequest
    {
        public string Nombre { get; set; }

        [Range(0,10000000, ErrorMessage = "La meta debe ser mayor a 0.")]
        public decimal Meta { get; set; }
        public bool EsColectiva {get; set;}
        public Guid UsuarioId { get; set; }
    }
}
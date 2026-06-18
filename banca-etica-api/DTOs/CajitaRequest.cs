using System;

namespace banca_etica_api.DTOs
{
    public class CajitaRequest
    {
        public string Nombre { get; set; }
        public decimal Meta { get; set; }
        public Guid UsuarioId { get; set; }
    }
}
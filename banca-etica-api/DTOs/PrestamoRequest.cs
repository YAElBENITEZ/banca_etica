using System;

namespace banca_etica_api.DTOs
{
    public class PrestamoRequest
    {
        public string Nombre { get; set; }
        public string TipoInteres { get; set; }
        public bool EsColectivo {get; set;}
        public decimal MontoAprobado { get; set; }
        public decimal TasaInteresAplicada { get; set; }
        public int PlazoMeses { get; set; }
        public string Estado { get; set; }
        public DateTimeOffset FechaDesembolso { get; set; }
        public Guid CajitaId { get; set; }
    }
}
using System;

namespace banca_etica_api.DTOs
{
    public class ComunidadRequest
    {
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
        public string Municipio { get; set; }
        public string Estado { get; set; }
    }
}
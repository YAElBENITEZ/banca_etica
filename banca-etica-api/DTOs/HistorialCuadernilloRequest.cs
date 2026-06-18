using System;

namespace banca_etica_api.DTOs
{
    public class HistorialCuadernilloRequest
    {
        public string TipoMovimiento { get; set; }
        public decimal Monto { get; set; }
        public string FirmaTesorero { get; set; }
        public Guid CajitaId { get; set; }
    }
}
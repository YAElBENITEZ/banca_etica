using System;

namespace banca_etica_api.Models
{
    public class HistorialCuadernillo
    {
        // 1. Llave Primaria
        public Guid Id { get; set; }

        // 2. Llave Foránea (Normalizada: solo apuntamos a la Cajita)
        public Guid CajitaId { get; set; }

        // 3. Atributos de Valor
        public decimal Monto { get; set; }
        public string TipoMovimiento { get; set; } // Typo corregido
        public DateTime Fecha { get; set; }
        public decimal SaldoAcumulado { get; set; }

        // 4. Atributos de Estado / Auditoría Inmutable
        public string FirmaTesorero { get; set; }
        public DateTime TimestampAuditoria { get; set; }
        public string DeviceIdOrigen { get; set; }

        // 5. Propiedades de Navegación (Hacia arriba)
        public Cajita Cajita { get; set; }
    }
}
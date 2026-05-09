using System;

namespace banca_etica_api.Models
{
    public class Prestamo
    {
        // 1. Llave Primaria
        public Guid Id { get; set; }

        // 2. Llave Foránea
        public Guid CajitaId { get; set; }

        // 3. Atributos Financieros
        public decimal MontoAprobado { get; set; }
        public decimal TasaInteresAplicada { get; set; }
        
        // 4. Control de Tiempo (¡Tu excelente aportación!)
        public DateTime FechaDesembolso { get; set; }
        public int PlazoMeses { get; set; }

        // 5. Atributos de Estado y Estructura (JSON para flexibilidad)
        public string Estado { get; set; } // "En revisión", "Aprobado", "Liquidado"
        public string AvalistasJson { get; set; } // Guardará IDs de los 2 socios avalistas
        public string TablaPagosJson { get; set; } // Guardará el calendario de pagos

        // 6. Propiedades de Navegación
        public Cajita Cajita { get; set; }
    }
}
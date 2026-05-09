using System;

namespace banca_etica_api.Models
{
    public class FondoUnion
    {
        // 1. Llave Primaria
        public Guid Id { get; set; }

        // 2. Llave Foránea (Alineada con el nombre de la tabla padre)
        public Guid ReglamentoUnionId { get; set; }

        // 3. Atributos Financieros
        public decimal SaldoColectivo { get; set; }
        public decimal ProyeccionFondo { get; set; }
        
        // 4. Control de Movimientos (JSON para flexibilidad rápida)
        public string HistorialIngresosJson { get; set; }
        public string HistorialEgresosJson { get; set; }    

        // 5. Atributos de Autorización y Auditoría
        public string FirmaDualConsejoJson { get; set; } 
        public DateTime UltimaActualizacion { get; set; } // Añadido para seguridad

        // 6. Propiedades de Navegación
        public ReglamentoUnion ReglamentoUnion { get; set; }
    }
}
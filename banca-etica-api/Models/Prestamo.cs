using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Prestamo
    {
        // 1. Llave Primaria
        public Guid Id { get; set; }

        // 2. Llave Foránea
        public Guid CajitaId { get; set; }

        public string Nombre { get; set; } // "En revisión", "Aprobado", "Liquidado"

        // 3. Atributos Financieros
        public decimal MontoAprobado { get; set; }
        public decimal TasaInteresAplicada { get; set; }
        
        // 4. Control de Tiempo (Cambiado a DateTimeOffset para Postgres)
        public DateTimeOffset FechaDesembolso { get; set; }
        public int PlazoMeses { get; set; }

        // 5. Atributos de Estado
        public string Estado { get; set; } // "En revisión", "Aprobado", "Liquidado"

        // 6. Propiedades de Navegación
        public Cajita Cajita { get; set; }

        // ¡ADIÓS JSON! HOLA RELACIONES:
        public virtual ICollection<TablaPagosPrestamo> Pagos { get; set; } = new List<TablaPagosPrestamo>();
        public virtual ICollection<PrestamoAvalista> Avalistas { get; set; } = new List<PrestamoAvalista>();
    }
}
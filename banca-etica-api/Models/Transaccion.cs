using System;

namespace banca_etica_api.Models
{
    public class Transaccion
    {
        // 1. Llave Primaria
        public Guid Id { get; set; }

        // 2. Llaves Foráneas
        public Guid UsuarioId { get; set; }
        
        // ¡Lección aplicada! Es Nullable (?) porque no toda transacción viene de una venta de mezcal
        public Guid? LoteProduccionId { get; set; } 

        // 3. Atributos de Transacción
        public decimal Monto { get; set; }
        public string Tipo { get; set; } // "Ingreso", "Egreso", "Cobro QR"
        public string Cliente { get; set; }
        public string CanalVenta { get; set; }
        public string Descripcion { get; set; }

        // 4. Metadatos de Integración (CoDi / Broxel)
        public string MetadatosJson { get; set; } // Guardará rastreos SPEI y payloads del banco

        // 5. Control de Tiempos y Trazabilidad  
        public DateTime Fecha { get; set; } 
        public string DeviceIdOrigen { get; set; } 
     
        // 6. Propiedades de Navegación
        public Usuario Usuario { get; set; }
        public LoteProduccion LoteProduccion { get; set; }
    }
}
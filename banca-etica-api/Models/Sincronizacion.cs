using System;

namespace banca_etica_api.Models
{
    public class Sincronizacion
    {
        // 1. Llave Primaria
        public Guid Id { get; set; }

        // 2. Llave Foránea (Seguridad)
        public Guid UsuarioId { get; set; }

        // 3. Datos de la Operación Offline
        public string DeviceId { get; set; }
        public string OperacionPendienteJson { get; set; } 
        public DateTime Timestamp { get; set; }
        
        // 4. Resolución y Estado
        public string Estado { get; set; } // "Pendiente", "Completada", "Error"
        public string ConflictoLWW { get; set; } // Log de cómo se resolvió un choque de datos

        // 5. Propiedades de Navegación
        public Usuario Usuario { get; set; }
    }
}
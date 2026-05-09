using System;

namespace banca_etica_api.Models
{
    public class ProgresoEducacion
    {
        // 1. Llave Primaria
        public Guid Id { get; set; }

        // 2. Llave Foránea
        public Guid UsuarioId { get; set; }

        // 3. Atributos de Progreso
        public string CapsulasAudioCompletadasJson { get; set; } 
        public bool UsoCalculadoraRentabilidad { get; set; }
        public bool GuiaSatRevisada { get; set; }

        // 4. Auditoría de Actividad (El toque de arquitecto)
        public DateTime FechaUltimaActividad { get; set; }

        // 5. Propiedades de Navegación
        public Usuario Usuario { get; set; }
    }
}
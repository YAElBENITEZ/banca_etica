using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class LoteProduccion
    {
        public Guid Id { get; set; }
        public Guid UsuarioId { get; set; }
        public string VariedadAgave { get; set; } 
        public string Parcela { get; set; } 

        // Representación de las etapas (Cocción, Molienda, etc.)
        public string EtapasJson { get; set; } 

        public float RendimientoLitros { get; set; } 
        public float MermasKilos { get; set; } 
        public string GaleriaCrtJson { get; set; } // Fotos para certificación

        public Usuario Usuario { get; set; }
    }
}
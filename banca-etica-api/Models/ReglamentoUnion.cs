using System;

namespace banca_etica_api.Models
{
    public class ReglamentoUnion
    {
        public Guid Id { get; set; }

        public string ConsejoAdministracionJson { get; set; } 
        public string ConsejoVigilanciaJson { get; set; } 
        public Guid TesoreroId { get; set; } 

        public string PeriodicidadAhorro { get; set; } 
        public decimal MontoMinimoAportacion { get; set; } 
        public decimal TasaInteresMensual { get; set; } 
        public decimal MultiploPrestamoMaximo { get; set; } 

        // Propiedades de navegación
        public Usuario Tesorero { get; set; } 
        public FondoUnion FondoUnion { get; set; }
    }
}
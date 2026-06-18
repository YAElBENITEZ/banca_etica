using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Cajita
    {
        // 1. Llave Primaria (Primary Key)
        public Guid Id { get; set; }

        // 2. Llave Foránea (Foreign Key)
        public Guid UsuarioId { get; set; }

        // 3. Atributos de Valor (Tipos de datos financieros)
        public string Nombre { get; set; }
        public decimal Meta { get; set; }
        public decimal SaldoActual { get; set; }
        public decimal PorcentajeAportacionFondo { get; set; }
        
        // 4. Atributos de Estado
        public string EstadoSync { get; set; }
        public decimal Proyeccion612Meses { get; set; }

        // 5. Propiedades de Navegación (La magia de Entity Framework)
        
        // Relación hacia "arriba" (Una cajita pertenece a UN usuario)
        public Usuario Usuario { get; set; }

        // Relación hacia "abajo" (Una cajita tiene MUCHOS registros e historiales)
        public ICollection<HistorialCuadernillo> Historial { get; set; }
        public ICollection<Prestamo> Prestamos { get; set; }
    }
}
using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Comunidad
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Municipio { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;

        // Relación inversa: Una comunidad tiene muchos usuarios
        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    }
}
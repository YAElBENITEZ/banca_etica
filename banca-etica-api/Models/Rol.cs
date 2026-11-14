using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Rol
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty; // GESTOR, TESORERO, SOCIO
        public string? Descripcion { get; set; }

        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    }
}
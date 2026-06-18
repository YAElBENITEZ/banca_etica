using System;
using System.Collections.Generic;

namespace banca_etica_api.Models
{
    public class Rol
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } // "Socio", "Tesorero", "Consejo", "Admin"
        public string Descripcion { get; set; } // Explicación de los permisos

        // Propiedad de navegación: Le dice a EF Core que un Rol tiene muchos Usuarios
        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    }
}
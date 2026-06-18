using System;

namespace banca_etica_api.Models
{
    public class PrestamoAvalista
    {
        public Guid PrestamoId { get; set; }
        public virtual Prestamo Prestamo { get; set; }

        public Guid AvalistaUsuarioId { get; set; }
        public virtual Usuario AvalistaUsuario { get; set; }
    }
}
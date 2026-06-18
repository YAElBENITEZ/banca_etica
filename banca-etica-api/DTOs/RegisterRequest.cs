using System;

namespace banca_etica_api.DTOs
{
    public class RegisterRequest
    {
        public string NombreCompleto { get; set; }
        public string Telefono { get; set; }
        public string Correo { get; set; }
        public string Password { get; set; }
        public Guid RolId { get; set; } // El ID del rol seleccionado (Socio, Tesorero, etc.)
    }
}
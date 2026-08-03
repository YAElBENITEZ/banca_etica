namespace banca_etica_api.DTOs
{
    public class ActualizarMiPerfilRequest
    {
        public string Correo { get; set; }
        public string Telefono { get; set; }
        public decimal UmbralAlertaSaldo { get; set; }
        public bool ConsentimientosArco { get; set; }
        public string? NuevaPassword { get; set; } // Opcional
    }
}
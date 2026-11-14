using System.Threading.Tasks;

namespace banca_etica_api.Services
{
    public interface IWhatsAppService
    {
        Task EnviarNotificacionPrestamoTesoreroAsync(string telefonoTesorero, string nombreTesorero, string nombreSocio, string fecha, string motivo);
    }
}
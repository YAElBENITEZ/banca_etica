using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace banca_etica_api.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<WhatsAppService> _logger;

        public WhatsAppService(HttpClient httpClient, IConfiguration config, ILogger<WhatsAppService> logger)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
        }

        public async Task EnviarNotificacionPrestamoTesoreroAsync(string telefonoTesorero, string nombreTesorero, string nombreSocio, string fecha, string motivo)
        {
            try
            {
                var phoneNumberId = _config["WhatsApp:PhoneNumberId"];
                var accessToken = _config["WhatsApp:AccessToken"];
                var templateName = _config["WhatsApp:TemplateName"] ?? "solicitud_prestamo_emergencia";

                if (string.IsNullOrWhiteSpace(phoneNumberId) || string.IsNullOrWhiteSpace(accessToken))
                {
                    _logger.LogWarning("WhatsApp Cloud API no está configurada (PhoneNumberId o AccessToken faltante).");
                    return;
                }

                var telefonoFormateado = NormalizarTelefonoMexico(telefonoTesorero);
                if (string.IsNullOrEmpty(telefonoFormateado))
                {
                    _logger.LogWarning("El número de teléfono del tesorero no es válido: {Telefono}", telefonoTesorero);
                    return;
                }

                // Payload con componentes posicionales para la plantilla {{1}}, {{2}}, {{3}}, {{4}}
                var payload = new
                {
                    messaging_product = "whatsapp",
                    to = telefonoFormateado,
                    type = "template",
                    template = new
                    {
                        name = templateName,
                        language = new { code = "es_MX" },
                        components = new object[]
                        {
                            new
                            {
                                type = "body",
                                parameters = new object[]
                                {
                                    new { type = "text", text = nombreTesorero },
                                    new { type = "text", text = nombreSocio },
                                    new { type = "text", text = fecha },
                                    new { type = "text", text = string.IsNullOrWhiteSpace(motivo) ? "Sin motivo especificado" : motivo }
                                }
                            }
                        }
                    }
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, $"https://graph.facebook.com/v21.0/{phoneNumberId}/messages");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error al enviar WhatsApp a {Telefono}. Status: {Status}, Detalle: {Detalle}", 
                        telefonoFormateado, response.StatusCode, responseContent);
                }
                else
                {
                    _logger.LogInformation("WhatsApp enviado exitosamente a {Telefono}.", telefonoFormateado);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción no controlada al intentar despachar mensaje de WhatsApp.");
            }
        }

        private static string NormalizarTelefonoMexico(string telefono)
        {
            if (string.IsNullOrWhiteSpace(telefono)) return string.Empty;

            // Extraer solo dígitos
            var digitos = Regex.Replace(telefono, @"\D", "");

            // Si tiene 10 dígitos (ej. celular México 2221234567), agregar 52
            if (digitos.Length == 10)
                return "52" + digitos;

            // Si viene con 521 (formato antiguo de celular WhatsApp), convertir a 52
            if (digitos.Length == 13 && digitos.StartsWith("521"))
                return "52" + digitos.Substring(3);

            return digitos;
        }
    }
}
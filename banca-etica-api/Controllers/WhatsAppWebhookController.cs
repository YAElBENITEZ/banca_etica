using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TuProyecto.Controllers
{
    [ApiController]
    [Route("api/webhook/whatsapp")]
    [AllowAnonymous] // Permite que los servidores de Meta lleguen sin token JWT
    public class WhatsAppWebhookController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<WhatsAppWebhookController> _logger;

        public WhatsAppWebhookController(IConfiguration configuration, ILogger<WhatsAppWebhookController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        // Endpoint GET: Validación inicial de Meta
        [HttpGet]
        public IActionResult VerifyWebhook(
            [FromQuery(Name = "hub.mode")] string? mode,
            [FromQuery(Name = "hub.challenge")] string? challenge,
            [FromQuery(Name = "hub.verify_token")] string? verifyToken)
        {
            // Lee WhatsApp__VerifyToken inyectado por Docker
            var expectedToken = _configuration["WhatsApp:VerifyToken"];

            if (mode == "subscribe" && verifyToken == expectedToken && !string.IsNullOrEmpty(challenge))
            {
                _logger.LogInformation("Webhook de WhatsApp verificado con éxito.");
                // Retorna el reto estrictamente en texto plano
                return Content(challenge, "text/plain");
            }

            _logger.LogWarning("Fallo en verificación de Webhook. Token recibido no coincide.");
            return Forbid();
        }

        // Endpoint POST: Recepción de mensajes y eventos
        [HttpPost]
        public IActionResult ReceiveEvent([FromBody] object payload)
        {
            _logger.LogInformation("Evento recibido de Meta: {Payload}", payload);
            // Meta exige responder 200 OK inmediatamente
            return Ok();
        }
    }
}
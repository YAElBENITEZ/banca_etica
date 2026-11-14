using banca_etica_api.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace banca_etica_api.Services;

/// <summary>
/// Almacenamiento local para desarrollo cuando Google Drive no está configurado.
/// No se usa en producción si existen todas las credenciales de Drive.
/// </summary>
public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly string _documentosPath;

    public LocalFileStorageService(IOptions<FileStorageSettings> settings, IWebHostEnvironment environment)
    {
        var configuredPath = string.IsNullOrWhiteSpace(settings.Value.DocumentosPath)
            ? "../banca-etica-docs"
            : settings.Value.DocumentosPath;

        _documentosPath = Path.GetFullPath(Path.Combine(environment.ContentRootPath, configuredPath));
        Directory.CreateDirectory(_documentosPath);
    }

    public async Task<string> GuardarDocumentoAsync(IFormFile archivo)
    {
        if (archivo is null || archivo.Length == 0)
            throw new ArgumentException("El archivo es nulo o inválido.");

        var extension = Path.GetExtension(archivo.FileName);
        var nombreArchivo = $"{Guid.NewGuid():N}{extension}";
        var ruta = ResolverRuta(nombreArchivo);

        await using var destino = File.Create(ruta);
        await archivo.CopyToAsync(destino);
        return nombreArchivo;
    }

    public Task<(Stream Stream, string ContentType, string FileName)> ObtenerDocumentoAsync(string fileIdOrPath)
    {
        var ruta = ResolverRuta(fileIdOrPath);
        if (!File.Exists(ruta))
            throw new FileNotFoundException("El documento no existe en el almacenamiento local.");

        Stream stream = File.OpenRead(ruta);
        var nombre = Path.GetFileName(ruta);
        return Task.FromResult((stream, ObtenerTipoContenido(Path.GetExtension(nombre)), nombre));
    }

    public void EliminarDocumento(string fileIdOrPath)
    {
        var ruta = ResolverRuta(fileIdOrPath);
        if (File.Exists(ruta)) File.Delete(ruta);
    }

    public string ObtenerRutaFisica(string fileIdOrPath) => ResolverRuta(fileIdOrPath);

    private string ResolverRuta(string fileIdOrPath)
    {
        var nombreSeguro = Path.GetFileName(fileIdOrPath);
        if (string.IsNullOrWhiteSpace(nombreSeguro))
            throw new ArgumentException("La referencia del documento es inválida.");

        return Path.Combine(_documentosPath, nombreSeguro);
    }

    private static string ObtenerTipoContenido(string extension) => extension.ToLowerInvariant() switch
    {
        ".pdf" => "application/pdf",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        _ => "application/octet-stream"
    };
}

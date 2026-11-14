using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace banca_etica_api.Services;

public interface IFileStorageService
{
    Task<string> GuardarDocumentoAsync(IFormFile archivo);
    Task<(Stream Stream, string ContentType, string FileName)> ObtenerDocumentoAsync(string fileIdOrPath);
    void EliminarDocumento(string fileIdOrPath);
    string ObtenerRutaFisica(string fileIdOrPath);
}
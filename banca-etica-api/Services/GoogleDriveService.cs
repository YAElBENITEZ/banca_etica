namespace banca_etica_api.Services;

using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

public class GoogleDriveService : IFileStorageService
{
    private readonly DriveService _driveService;
    private readonly string _folderId;

    public GoogleDriveService(IConfiguration configuration)
    {
        _folderId = configuration["GoogleDrive:FolderId"] 
            ?? Environment.GetEnvironmentVariable("GoogleDrive__FolderId")
            ?? throw new InvalidOperationException("Falta configurar GoogleDrive:FolderId.");

        string clientId = configuration["GoogleDrive:ClientId"] 
            ?? Environment.GetEnvironmentVariable("GoogleDrive__ClientId")
            ?? throw new InvalidOperationException("Falta configurar GoogleDrive:ClientId.");

        string clientSecret = configuration["GoogleDrive:ClientSecret"] 
            ?? Environment.GetEnvironmentVariable("GoogleDrive__ClientSecret")
            ?? throw new InvalidOperationException("Falta configurar GoogleDrive:ClientSecret.");

        string refreshToken = configuration["GoogleDrive:RefreshToken"] 
            ?? Environment.GetEnvironmentVariable("GoogleDrive__RefreshToken")
            ?? throw new InvalidOperationException("Falta configurar GoogleDrive:RefreshToken.");

        var tokenResponse = new TokenResponse { RefreshToken = refreshToken };

        var flowInitializer = new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = clientId,
                ClientSecret = clientSecret
            },
            Scopes = new[] { DriveService.Scope.Drive }
        };

        var flow = new GoogleAuthorizationCodeFlow(flowInitializer);
        var credential = new UserCredential(flow, "user", tokenResponse);

        _driveService = new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "BancaEticaApi"
        });
    }

    public async Task<string> GuardarDocumentoAsync(IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
            throw new ArgumentException("El archivo es nulo o inválido.");

        string extension = Path.GetExtension(archivo.FileName);
        string uniqueFileName = $"{Guid.NewGuid():N}_{archivo.FileName}";

        var fileMetadata = new Google.Apis.Drive.v3.Data.File
        {
            Name = uniqueFileName,
            Parents = new List<string> { _folderId }
        };

        await using var stream = archivo.OpenReadStream();
        var request = _driveService.Files.Create(fileMetadata, stream, archivo.ContentType);
        request.Fields = "id";

        var uploadProgress = await request.UploadAsync();
        if (uploadProgress.Status != Google.Apis.Upload.UploadStatus.Completed)
        {
            throw new Exception($"Error al subir archivo a Drive: {uploadProgress.Exception?.Message}");
        }

        return request.ResponseBody.Id;
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> ObtenerDocumentoAsync(string fileId)
    {
        var getRequest = _driveService.Files.Get(fileId);
        getRequest.Fields = "name, mimeType";
        var fileInfo = await getRequest.ExecuteAsync();

        var memoryStream = new MemoryStream();
        await getRequest.DownloadAsync(memoryStream);
        memoryStream.Position = 0;

        return (memoryStream, fileInfo.MimeType, fileInfo.Name);
    }

    public void EliminarDocumento(string fileId)
    {
        if (string.IsNullOrWhiteSpace(fileId)) return;

        try
        {
            _driveService.Files.Delete(fileId).Execute();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al eliminar archivo en Drive ({fileId}): {ex.Message}");
        }
    }

    public string ObtenerRutaFisica(string fileId)
    {
        return fileId;
    }
}
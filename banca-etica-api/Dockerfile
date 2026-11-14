FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Forzar a .NET a usar IPv4 para evitar timeouts de red en VPS
ENV DOTNET_SYSTEM_NET_HTTP_ENABLEIPV6=0
ENV NUGET_XMLDOC_MODE=skip

# Copiar archivos de solución y proyectos
COPY *.csproj ./

# Restauración secuencial con timeout rápido por petición
RUN dotnet restore --disable-parallel -v n

# Copiar el resto del código y compilar
COPY . .
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "banca-etica-api.dll"]

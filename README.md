# MezcalPay - Configuración de Base de Datos

Guía para levantar el entorno local de base de datos y sincronizar los modelos de C# .NET con PostgreSQL usando Entity Framework Core.

## Requisitos previos

- Docker Desktop instalado y en ejecución.
- WSL 2 con Ubuntu.
- Integración de Docker con WSL activada en Docker Desktop:
  - `Settings > Resources > WSL Integration`
- .NET 8 SDK instalado.
- Acceso al repositorio del proyecto.

## 1. Levantar la infraestructura con Docker

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Servicios disponibles:

- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

Credenciales de pgAdmin:

```text
Usuario: admin@mezcalpay.com
Contraseña: admin
```

## 2. Configurar el backend .NET

Entrar a la carpeta del API:

```bash
cd banca-etica-api
```

## 3. Instalar Entity Framework Core Tools

Para evitar conflictos de versiones, usar Entity Framework Core 8:

```bash
dotnet tool uninstall --global dotnet-ef
dotnet tool install --global dotnet-ef --version "8.0.*"
```

Verificar la instalación:

```bash
dotnet ef --version
```

## 4. Instalar dependencias del proyecto

Desde la carpeta del API:

```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version "8.0.*"
dotnet add package Microsoft.EntityFrameworkCore.Design --version "8.0.*"
```

Restaurar dependencias:

```bash
dotnet restore
```

## 5. Configurar la cadena de conexión

Verificar que el archivo `appsettings.Development.json` contenga:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=mezcalpay;Username=postgres;Password=password123"
  }
}
```

## 6. Crear la migración inicial

Ejecutar el siguiente comando desde la carpeta del API:

```bash
dotnet ef migrations add InicializacionMezcalPay
```

Si la migración ya existe, omitir este paso.

## 7. Aplicar la migración a la base de datos

```bash
dotnet ef database update
```

## 8. Verificar la base de datos en pgAdmin

1. Abrir `http://localhost:5050`.
2. Iniciar sesión con las credenciales de pgAdmin.
3. Registrar un nuevo servidor.
4. Usar la siguiente configuración:

```text
Name: MezcalPay Local
Host: db
Port: 5432
Maintenance database: mezcalpay
Username: postgres
Password: password123
```

Si la conexión se hace desde fuera de Docker, usar:

```text
Host: localhost
```

## 9. Verificar tablas creadas

Después de ejecutar las migraciones, validar que existan las tablas principales del sistema, por ejemplo:

- Usuarios
- Cajitas
- Prestamos
- Lotes
- Transacciones
- FondoUnion
- LoteProduccion

## Comandos útiles

Detener los contenedores:

```bash
docker compose down
```

Volver a levantar los contenedores:

```bash
docker compose up -d
```

Ver contenedores activos:

```bash
docker ps
```

Ver logs de los contenedores:

```bash
docker compose logs
```

Reaplicar migraciones pendientes:

```bash
dotnet ef database update
```

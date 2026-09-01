using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using banca_etica_api.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de la Base de Datos con PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Clave Secreta para JWT (Misma que usas en AuthController)
var jwtSecretKey = "SuperClaveSecretaBancaEtica2026_ClaveLargaYSegura";
var keyBytes = Encoding.UTF8.GetBytes(jwtSecretKey);

// 3. Configuración de Autenticación con JWT Bearer
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Solo para desarrollo local
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = false,   // Cambiar a true si defines Issuer en Login
        ValidateAudience = false, // Cambiar a true si defines Audience en Login
        ClockSkew = TimeSpan.Zero
    };
});

// 4. Configuración de CORS para React
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000") // Soportar Vite o CRA
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 5. Agregar los controladores de la API
builder.Services.AddControllers();

// 6. Configuración de Swagger habilitado para recibir Tokens JWT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Banca Ética API", Version = "v1" });

    // Agregar candado "Authorize" en la interfaz gráfica de Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Ingresa el token JWT así: Bearer {tu_token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ------------------- PIPELINE DE PETICIONES HTTP -------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// EL ORDEN DE ESTOS MIDDLEWARES ES CRÍTICO:
app.UseCors("PermitirReact"); // 1. Permitir peticiones cross-origin

app.UseAuthentication();     // 2. Identificar quién es el usuario (Lee el Token JWT)
app.UseAuthorization();      // 3. Comprobar si tiene permiso/rol para esa ruta

app.MapControllers();

app.Run();
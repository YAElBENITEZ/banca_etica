using Microsoft.EntityFrameworkCore;
using banca_etica_api.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de la Base de Datos con PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Agregar los controladores de la API
builder.Services.AddControllers();

// 3. Configuración de Swagger (Para documentar y probar tu API visualmente)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 1. Agrega esto ANTES de builder.Build();
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // El puerto de tu frontend
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// 2. Agrega esto DESPUÉS de app.UseRouting() o app.UseHttpsRedirection();
app.UseCors("PermitirReact");

// 4. Configuración del Pipeline de HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
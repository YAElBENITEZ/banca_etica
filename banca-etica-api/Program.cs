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

var app = builder.Build();

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
using Dapper;
using RapidDev.Application.Service.Implementation.Auth;
using RapidDev.Application.Service.Implementation.Common;
using RapidDev.Application.Service.Interface.Auth;
using RapidDev.Application.Service.Interface.Common;
using RapidDev.WebApi.Utilities;


Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddControllers();

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAdminAuthService, AdminAuthService>();

var app = builder.Build();

await AdminSeeder.SeedAsync(app.Services);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



app.MapControllers();

app.Run();

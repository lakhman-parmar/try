using Dapper;
using RapidDev.Application.Services.Implementation.Auth;
using RapidDev.Application.Services.Implementation.Common;
using RapidDev.Application.Services.Implementation.Purchase;
using RapidDev.Application.Services.Interfaces.Auth;
using RapidDev.Application.Services.Interfaces.Common;
using RapidDev.Application.Services.Interfaces.Purchase;
using RapidDev.Infrastructure.Repositories.Implementation.Common;
using RapidDev.Infrastructure.Repositories.Implementation.Purchase;
using RapidDev.Infrastructure.Repositories.Interfaces.Purchase;
using RapidDev.WebApi.Utilities;

Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAdminAuthService, AdminAuthService>();

builder.Services.AddScoped<IPurchaseRequisitionRepository, PurchaseRequisitionRepository>();
builder.Services.AddScoped<IPurchaseRequisitionService, PurchaseRequisitionService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

await AdminSeeder.SeedAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AngularPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
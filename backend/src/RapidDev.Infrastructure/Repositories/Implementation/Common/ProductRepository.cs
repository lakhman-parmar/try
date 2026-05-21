using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Common;
using RapidDev.Infrastructure.Repositories.Interfaces.Common;

namespace RapidDev.Infrastructure.Repositories.Implementation.Common;

public class ProductRepository : IProductRepository
{
    private readonly string _connectionString;

    public ProductRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found.");
    }

    private IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    public async Task<IEnumerable<ProductDto>> GetAllAsync()
    {
        using var conn = CreateConnection();

        const string sp = "sp_GetAllProducts";

        var products = await conn.QueryAsync<ProductDto>(
            sp,
            commandType: CommandType.StoredProcedure
        );

        return products;
    }
}
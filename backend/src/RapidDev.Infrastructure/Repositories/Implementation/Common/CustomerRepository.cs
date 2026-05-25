using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Interfaces.Repositories.Common;

namespace RapidDev.Infrastructure.Repositories.Implementation.Common;

public class CustomerRepository : ICustomerRepository
{
    private readonly string _connectionString;

    public CustomerRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<IEnumerable<CustomerDto>> GetAllAsync()
    {
        using var conn = CreateConnection();

        return await conn.QueryAsync<CustomerDto>(
            "sp_GetAllCustomers",
            commandType: CommandType.StoredProcedure);
    }
}

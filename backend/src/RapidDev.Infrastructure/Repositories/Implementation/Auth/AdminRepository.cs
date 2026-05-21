using System;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.Interfaces.Repositories;
using RapidDev.Domain.Models;

namespace RapidDev.Infrastructure.Repositories.Implementation.Auth;

public class AdminRepository : IAdminRepository
{
    private readonly IConfiguration _configuration;

    public AdminRepository(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private SqlConnection CreateConnection()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection")
            ?? _configuration["ConnectionStrings:DefaultConnection"];

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("DefaultConnection is not configured.");

        return new SqlConnection(connectionString);
    }

    public async Task<Admin?> GetByIdAsync(int? adminId)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();

        return await connection.QuerySingleOrDefaultAsync<Admin>(
            "dbo.Admin_GetById",
            new { AdminId = adminId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Admin?> GetByEmailAsync(string? email)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();

        return await connection.QuerySingleOrDefaultAsync<Admin>(
            "dbo.Admin_GetByEmail",
            new { Email = email },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateRefreshTokenAsync(
        int adminId,
        string tokenHash,
        bool isRevoked,
        DateTime createdAt,
        DateTime expiredAt)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();

        return await connection.ExecuteAsync(
            "dbo.Admin_RefreshToken_Create",
            new
            {
                AdminId = adminId,
                TokenHash = tokenHash,
                IsRevoked = isRevoked,
                CreatedAt = createdAt,
                ExpiredAt = expiredAt
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();

        return await connection.QuerySingleOrDefaultAsync<RefreshToken>(
            "dbo.Admin_RefreshToken_GetByHash",
            new { TokenHash = tokenHash },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> RevokeRefreshTokenByHashAsync(string tokenHash)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();

        return await connection.ExecuteAsync(
            "dbo.Admin_RefreshToken_RevokeByHash",
            new { TokenHash = tokenHash },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> RevokeRefreshTokenAsync(int refreshTokenId)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();

        return await connection.ExecuteAsync(
            "dbo.Admin_RefreshToken_Revoke",
            new { RefreshTokenId = refreshTokenId },
            commandType: CommandType.StoredProcedure);
    }
}

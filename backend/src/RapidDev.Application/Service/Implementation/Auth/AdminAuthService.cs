using System.Data;
using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using RapidDev.Domain.Models;
using RapidDev.Application.DTOs.Auth;
using RapidDev.Application.DTOs.Auth.Request;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Service.Interface.Auth;
using RapidDev.Application.Service.Interface.Common;

namespace RapidDev.Application.Service.Implementation.Auth;

public class AdminAuthService : IAdminAuthService
{
    public readonly IPasswordHasher _passwordHasher;
    public readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminAuthService> _logger;

    private const string AdminRole = "Admin";
    private const int RefreshTokenDays = 30;

 
    public AdminAuthService(
        IPasswordHasher passwordHasher,
        IJwtService jwtService,
        IConfiguration configuration,
        ILogger<AdminAuthService> logger)
    {
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _configuration = configuration;
        _logger = logger;
    }

    private SqlConnection CreateConnection()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection")
            ?? _configuration["ConnectionStrings:DefaultConnection"];

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("DefaultConnection is not configured.");

        return new SqlConnection(connectionString);
    }
 
    public async Task<ApiResponse<AuthResult>> LoginAsync(AdminLoginDto admin)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();

        _logger.LogInformation("Admin login attempt for {Email}", admin.Email);

        var adminUser = await connection.QuerySingleOrDefaultAsync<Admin>(
            "dbo.Admin_GetByEmail",
            new { admin.Email },
            commandType: CommandType.StoredProcedure);

        if (adminUser == null)
        {
            _logger.LogWarning("Admin login failed: user not found for {Email}", admin.Email);
            return ApiResponse<AuthResult>.Failure("Invalid Credentials");
        }

        if (string.IsNullOrWhiteSpace(adminUser.PasswordHash))
        {
            _logger.LogWarning("Admin login failed: empty password hash for {Email}", admin.Email);
            return ApiResponse<AuthResult>.Failure("Invalid Credentials");
        }

        var isValid = await _passwordHasher.Verify(admin.Password, adminUser.PasswordHash);

        if (!isValid)
        {
            _logger.LogWarning("Admin login failed: password mismatch for {Email}", admin.Email);
            return ApiResponse<AuthResult>.Failure("Invalid Credentials");
        }

        var accessToken = await _jwtService.GenerateToken(adminUser.AdminId, adminUser.Email, AdminRole, 10);

        var rawToken = await _passwordHasher.GenerateSecureToken();
        var tokenHash = await _passwordHasher.HashWithoutSalt(rawToken);

        await connection.ExecuteAsync(
            "dbo.Admin_RefreshToken_Create",
            new
            {
                AdminId = adminUser.AdminId,
                TokenHash = tokenHash,
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow,
                ExpiredAt = DateTime.UtcNow.AddDays(RefreshTokenDays)
            },
            commandType: CommandType.StoredProcedure);

        _logger.LogInformation("Admin login succeeded for {Email}", admin.Email);

        return ApiResponse<AuthResult>.Success(
            new AuthResult
            {
                Token = accessToken,
                RefreshToken = rawToken
            },
            "Logged in Successfully");
    }
 
    public async Task<ApiResponse<object>> LogoutAsync(string rawToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
            return ApiResponse<object>.Success(null!, "Logged Out Successfully");

        var refreshTokenHash = await _passwordHasher.HashWithoutSalt(rawToken);

        await using var connection = CreateConnection();
        await connection.OpenAsync();

        var affected = await connection.ExecuteAsync(
            "dbo.Admin_RefreshToken_RevokeByHash",
            new { TokenHash = refreshTokenHash },
            commandType: CommandType.StoredProcedure);

        if (affected == 0)
        {
            _logger.LogWarning("Admin logout failed: token not found or already revoked");
            return ApiResponse<object>.Failure("Invalid or already revoked token.");
        }

        _logger.LogInformation("Admin logout succeeded");

        return ApiResponse<object>.Success(null!, "Logged Out Successfully");
    }
 
    public async Task<ApiResponse<AuthResult>> RefreshAsync(string refreshTokenString)
    {
        if (string.IsNullOrWhiteSpace(refreshTokenString))
            return ApiResponse<AuthResult>.Failure("No refresh token provided.");

        var refreshTokenHash = await _passwordHasher.HashWithoutSalt(refreshTokenString);

        await using var connection = CreateConnection();
        await connection.OpenAsync();

        var storedToken = await connection.QuerySingleOrDefaultAsync<RefreshToken>(
            "dbo.Admin_RefreshToken_GetByHash",
            new { TokenHash = refreshTokenHash },
            commandType: CommandType.StoredProcedure);

        if (storedToken == null)
        {
            _logger.LogWarning("Admin refresh failed: token not found");
            return ApiResponse<AuthResult>.Failure("Invalid refresh token.");
        }

        if (storedToken.IsRevoked == true)
        {
            _logger.LogWarning("Admin refresh failed: token already revoked");
            return ApiResponse<AuthResult>.Failure("Session invalidated. Please login again.");
        }

        if (storedToken.ExpiredAt.HasValue && storedToken.ExpiredAt.Value < DateTime.UtcNow)
        {
            _logger.LogWarning("Admin refresh failed: token expired");
            return ApiResponse<AuthResult>.Failure("Refresh token expired.");
        }

        var adminUser = await connection.QuerySingleOrDefaultAsync<Admin>(
            "dbo.Admin_GetById",
            new { AdminId = storedToken.AdminId },
            commandType: CommandType.StoredProcedure);

        if (adminUser == null)
        {
            _logger.LogWarning("Admin refresh failed: admin not found for id {AdminId}", storedToken.AdminId);
            return ApiResponse<AuthResult>.Failure("Invalid session. Please login again.");
        }

        await connection.ExecuteAsync(
            "dbo.Admin_RefreshToken_Revoke",
            new { RefreshTokenId = storedToken.RefreshTokenId },
            commandType: CommandType.StoredProcedure);

        var newRawToken = await _passwordHasher.GenerateSecureToken();
        var newTokenHash = await _passwordHasher.HashWithoutSalt(newRawToken);

        await connection.ExecuteAsync(
            "dbo.Admin_RefreshToken_Create",
            new
            {
                AdminId = adminUser.AdminId,
                TokenHash = newTokenHash,
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow,
                ExpiredAt = DateTime.UtcNow.AddDays(RefreshTokenDays)
            },
            commandType: CommandType.StoredProcedure);

        var accessToken = await _jwtService.GenerateToken(
            adminUser.AdminId,
            adminUser.Email,
            AdminRole,
            15);

        return ApiResponse<AuthResult>.Success(
            new AuthResult
            {
                Token = accessToken,
                RefreshToken = newRawToken
            },
            "Token refreshed successfully.");
 }
 
}

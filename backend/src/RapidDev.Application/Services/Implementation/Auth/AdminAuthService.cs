using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using RapidDev.Domain.Models;
using RapidDev.Application.DTOs.Auth;
using RapidDev.Application.DTOs.Auth.Request;
using RapidDev.Application.DTOs.Auth.Response;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Services.Interfaces.Auth;
using RapidDev.Application.Services.Interfaces.Common;
using RapidDev.Application.Interfaces.Repositories;

namespace RapidDev.Application.Services.Implementation.Auth;

public class AdminAuthService : IAdminAuthService
{
    public readonly IPasswordHasher _passwordHasher;
    public readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminAuthService> _logger;
    private readonly IAdminRepository _adminRepository;

    private const string AdminRole = "Admin";
    private const int RefreshTokenDays = 30;

 
    public AdminAuthService(
        IPasswordHasher passwordHasher,
        IJwtService jwtService,
        IConfiguration configuration,
        ILogger<AdminAuthService> logger,
        IAdminRepository adminRepository)
    {
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _configuration = configuration;
        _logger = logger;
        _adminRepository = adminRepository;
    }

    public async Task<ApiResponse<AuthResult>> LoginAsync(AdminLoginDto admin)
    {
        _logger.LogInformation("Admin login attempt for {Email}", admin.Email);

        var adminUser = await _adminRepository.GetByEmailAsync(admin.Email);

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

        await _adminRepository.CreateRefreshTokenAsync(
            adminUser.AdminId,
            tokenHash,
            false,
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(RefreshTokenDays));

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

        var affected = await _adminRepository.RevokeRefreshTokenByHashAsync(refreshTokenHash);

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

        var storedToken = await _adminRepository.GetRefreshTokenByHashAsync(refreshTokenHash);

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

        var adminUser = await _adminRepository.GetByIdAsync(storedToken.AdminId);

        if (adminUser == null)
        {
            _logger.LogWarning("Admin refresh failed: admin not found for id {AdminId}", storedToken.AdminId);
            return ApiResponse<AuthResult>.Failure("Invalid session. Please login again.");
        }

        await _adminRepository.RevokeRefreshTokenAsync(storedToken.RefreshTokenId);

        var newRawToken = await _passwordHasher.GenerateSecureToken();
        var newTokenHash = await _passwordHasher.HashWithoutSalt(newRawToken);

        await _adminRepository.CreateRefreshTokenAsync(
            adminUser.AdminId,
            newTokenHash,
            false,
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(RefreshTokenDays));

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

    public async Task<ApiResponse<AdminProfileDto>> GetProfileAsync(int adminId)
    {
        _logger.LogInformation("Retrieving profile for admin ID {AdminId}", adminId);

        var adminUser = await _adminRepository.GetByIdAsync(adminId);

        if (adminUser == null)
        {
            _logger.LogWarning("Admin profile retrieval failed: admin user not found for ID {AdminId}", adminId);
            return ApiResponse<AdminProfileDto>.Failure("Admin user not found.");
        }

        var profileDto = new AdminProfileDto
        {
            AdminId = adminUser.AdminId,
            Name = adminUser.Name,
            Email = adminUser.Email,
            CreatedAt = adminUser.CreatedAt
        };

        return ApiResponse<AdminProfileDto>.Success(profileDto, "Admin profile retrieved successfully.");
    }
}

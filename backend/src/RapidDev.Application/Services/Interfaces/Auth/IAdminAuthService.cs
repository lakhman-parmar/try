using RapidDev.Application.DTOs.Auth;
using RapidDev.Application.DTOs.Auth.Request;
using RapidDev.Application.DTOs.Auth.Response;
using RapidDev.Application.DTOs.Common;

namespace RapidDev.Application.Services.Interfaces.Auth;

public interface IAdminAuthService
{
    Task<ApiResponse<AuthResult>> LoginAsync(AdminLoginDto admin);
    Task<ApiResponse<object>> LogoutAsync(string rawToken);
    Task<ApiResponse<AuthResult>> RefreshAsync(string refreshToken);
    Task<ApiResponse<AdminProfileDto>> GetProfileAsync(int adminId);
}

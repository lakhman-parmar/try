using System.Threading.Tasks;
using RapidDev.Domain.Models;

namespace RapidDev.Application.Interfaces.Repositories;

public interface IAdminRepository
{
    Task<Admin?> GetByIdAsync(int? adminId);
    Task<Admin?> GetByEmailAsync(string? email);
    Task<int> CreateRefreshTokenAsync(
        int adminId,
        string tokenHash,
        bool isRevoked,
        DateTime createdAt,
        DateTime expiredAt);
    Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash);
    Task<int> RevokeRefreshTokenByHashAsync(string tokenHash);
    Task<int> RevokeRefreshTokenAsync(int refreshTokenId);
}

using System.Security.Cryptography;
using System.Text;
using RapidDev.Application.Service.Interface.Common;

namespace RapidDev.Application.Service.Implementation.Common;

public class PasswordHasher : IPasswordHasher
{
    public Task<string> Hash(string password)
    {
        string hash = BCrypt.Net.BCrypt.HashPassword(password);
        return Task.FromResult(hash);
    }

    public Task<bool> Verify(string password, string hash)
    {
        bool valid = BCrypt.Net.BCrypt.Verify(password, hash);
        return Task.FromResult(valid);
    }

    public Task<string> HashWithoutSalt(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Task.FromResult(Convert.ToHexString(bytes).ToLower());
    }

    public Task<string> GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32); // 256-bit token
        return Task.FromResult(Convert.ToHexString(bytes).ToLower());
    }

    public Task<string> GenerateSecureFamilyToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(16); // 128-bit token
        return Task.FromResult(Convert.ToHexString(bytes).ToLower());
    }
}

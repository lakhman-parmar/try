namespace RapidDev.Application.Services.Interfaces.Common;

public interface IPasswordHasher
{
    Task<string> Hash(string password);
    Task<bool> Verify(string password, string hash);
    Task<string> HashWithoutSalt(string rawToken);
    Task<string> GenerateSecureToken();
    Task<string> GenerateSecureFamilyToken();
}

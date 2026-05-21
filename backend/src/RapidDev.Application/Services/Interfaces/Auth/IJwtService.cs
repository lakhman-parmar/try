namespace RapidDev.Application.Services.Interfaces.Auth;

public interface IJwtService
{
    Task<string> GenerateToken(int id, string mail, string role, int expiryMinutes);
}

namespace RapidDev.Application.Service.Interface.Auth;

public interface IJwtService
{
    Task<string> GenerateToken(int id, string mail, string role, int expiryMinutes);
}

namespace RapidDev.Application.DTOs.Auth;

public class AuthResult
{
    public required string Token { get; set; }
    public required string RefreshToken { get; set; }
}

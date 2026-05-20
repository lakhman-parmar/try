namespace RapidDev.Application.DTOs.Auth;

public class TokenResponse
{
    public required string Token { get; set; }

    public static TokenResponse SetToken(string token) => new()
    {
        Token = token
    };
}

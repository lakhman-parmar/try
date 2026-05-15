namespace RapidDev.Domain.Models;

public class RefreshToken
{
    public int RefreshTokenId { get; set; }
    public int? AdminId { get; set; }
    public string? TokenHash { get; set; }
    public bool? IsRevoked { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ExpiredAt { get; set; }

    public Admin? Admin { get; set; }
}

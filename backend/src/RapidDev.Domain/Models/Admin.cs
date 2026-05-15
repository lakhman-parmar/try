namespace RapidDev.Domain.Models;

public class Admin
{
    public int AdminId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PasswordHash { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

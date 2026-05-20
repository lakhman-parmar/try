using System.ComponentModel.DataAnnotations;

namespace RapidDev.Application.DTOs.Auth.Request;

public class AdminLoginDto
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [MinLength(8)]
    [MaxLength(15)]
    public required string Password { get; set; }
}

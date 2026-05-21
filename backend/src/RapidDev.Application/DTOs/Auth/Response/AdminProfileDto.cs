using System;

namespace RapidDev.Application.DTOs.Auth.Response;

public class AdminProfileDto
{
    public int AdminId { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public DateTime? CreatedAt { get; set; }
}

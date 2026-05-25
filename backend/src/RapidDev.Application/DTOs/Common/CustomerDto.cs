namespace RapidDev.Application.DTOs.Common;

public class CustomerDto
{
    public int CustomerId { get; set; }
    public string Name { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

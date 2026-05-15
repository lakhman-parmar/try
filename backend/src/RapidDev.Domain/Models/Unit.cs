namespace RapidDev.Domain.Models;

public class Unit
{
    public int UnitId { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}

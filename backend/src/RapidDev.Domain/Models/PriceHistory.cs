namespace RapidDev.Domain.Models;

public class PriceHistory
{
    public int PriceHistoryId { get; set; }
    public int? ProductId { get; set; }
    public decimal OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public DateTime? CreatedAt { get; set; }

    public Product? Product { get; set; }
}

namespace RapidDev.Domain.Models;

public class EstimationItem
{
    public int EstimationItemId { get; set; }
    public int? EstimationId { get; set; }
    public int? ProductId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Estimation? Estimation { get; set; }
    public Product? Product { get; set; }
    public ICollection<SalesOrderItem> SalesOrderItems { get; set; } = new List<SalesOrderItem>();
}

namespace RapidDev.Domain.Models;

public class Estimation
{
    public int EstimationId { get; set; }
    public string EstimationNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }
    
    public Customer? Customer { get; set; }
    public ICollection<EstimationItem> EstimationItems { get; set; } = new List<EstimationItem>();
    public ICollection<SalesOrderItem> SalesOrderItems { get; set; } = new List<SalesOrderItem>();
}

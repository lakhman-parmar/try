namespace RapidDev.Domain.Models;

public class Customer
{
    public int CustomerId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }
    
    public ICollection<Estimation> Estimations { get; set; } = new List<Estimation>();
    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();
    public ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
}

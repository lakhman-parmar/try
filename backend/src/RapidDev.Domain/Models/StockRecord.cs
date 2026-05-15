using RapidDev.Domain.Enums;

namespace RapidDev.Domain.Models;

public class StockRecord
{
    public int StockRecordId { get; set; }
    public int? ProductId { get; set; }
    public RecordType? RecordType { get; set; }
    public int TransactionId { get; set; }
    public decimal? QuantityChange { get; set; }
    public decimal? Price { get; set; }
    public string? Reason { get; set; }
    public DateTime? CreatedAt { get; set; }

    public Product? Product { get; set; }
}

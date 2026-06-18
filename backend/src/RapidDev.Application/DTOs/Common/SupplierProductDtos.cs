using System.ComponentModel.DataAnnotations;

namespace RapidDev.Application.DTOs.Common;

public class SupplierProductDto
{
    public int SupplierProductId { get; set; }
    public int ProductId { get; set; }
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = null!;
    public decimal? PurchasePrice { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
}

public class UpsertSupplierProductDto
{
    public int ProductId { get; set; }
    public int SupplierId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Purchase price cannot be negative.")]
    public decimal PurchasePrice { get; set; }
}

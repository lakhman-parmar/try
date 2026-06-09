// RapidDev.Application/Services/Interfaces/Purchase/IPurchaseBillPdfService.cs

using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Purchase;

public interface IPurchaseBillPdfService
{
    /// <summary>
    /// Generates a PDF byte array for the given purchase bill.
    /// </summary>
    byte[] Generate(PurchaseBillDetailDto bill);
}

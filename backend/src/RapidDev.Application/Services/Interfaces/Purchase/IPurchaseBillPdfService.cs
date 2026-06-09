using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Purchase;

public interface IPurchaseBillPdfService
{
    byte[] Generate(PurchaseBillDetailDto bill);
}

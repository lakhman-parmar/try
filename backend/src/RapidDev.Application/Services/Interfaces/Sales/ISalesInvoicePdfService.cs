using RapidDev.Application.DTOs.Sales;

namespace RapidDev.Application.Services.Interfaces.Sales;

public interface ISalesInvoicePdfService
{
    byte[] Generate(SalesInvoiceDetailDto invoice);
}

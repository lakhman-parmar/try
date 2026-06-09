using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.WebApi.Controllers.Sales;

[ApiController]
[Route("api/sales-invoices")]
public class SalesInvoiceController : ControllerBase
{
    private readonly ISalesInvoiceService _service;
    private readonly ISalesInvoicePdfService _pdfService;

    public SalesInvoiceController(
        ISalesInvoiceService service,
        ISalesInvoicePdfService pdfService)
    {
        _service = service;
        _pdfService = pdfService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] SalesInvoiceFilterDto filter)
    {
        var errors = SalesValidation.ValidateFilter(filter.PageNumber, filter.PageSize, filter.FromDate, filter.ToDate, filter.Search);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid filter.", errors));

        var result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<SalesInvoiceListItemDto>>.Success(result));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await _service.GetByIdAsync(id);
        if (invoice is null)
            return NotFound(ApiResponse<string>.Failure("Sales invoice not found."));

        return Ok(ApiResponse<SalesInvoiceDetailDto>.Success(invoice));
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> DownloadPdf(int id)
    {
        var invoice = await _service.GetByIdAsync(id);
        if (invoice is null)
            return NotFound(ApiResponse<string>.Failure("Sales invoice not found."));

        var pdfBytes = _pdfService.Generate(invoice);
        return File(pdfBytes, "application/pdf", $"{invoice.InvoiceNumber}.pdf");
    }

    [HttpGet("orders-for-invoice")]
    public async Task<IActionResult> GetOrdersForInvoice()
    {
        var result = await _service.GetOrdersForInvoiceAsync();
        return Ok(ApiResponse<IEnumerable<SalesOrderForInvoiceDto>>.Success(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalesInvoiceDto dto)
    {
        var errors = SalesValidation.Validate(dto);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid sales invoice.", errors));

        var newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { SalesInvoiceId = newId }, "Sales invoice created and stock updated."));
    }

    [HttpPost("{id:int}/regenerate")]
    public async Task<IActionResult> Regenerate(int id, [FromBody] RegenerateSalesInvoiceDto dto)
    {
        var errors = SalesValidation.Validate(dto);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid sales invoice.", errors));

        var newId = await _service.RegenerateAsync(id, dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { SalesInvoiceId = newId }, "Sales invoice regenerated and stock updated."));
    }
}

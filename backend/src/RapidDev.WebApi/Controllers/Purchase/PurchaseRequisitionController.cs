using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.WebApi.Controllers.Purchase;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/purchase-requisitions")]
public class PurchaseRequisitionController(IPurchaseRequisitionService _service) : ControllerBase
{
    // GET /api/purchase-requisitions?search=&fromDate=&toDate=&pageNumber=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PurchaseRequisitionFilterDto filter)
    {
        PagedResult<PurchaseRequisitionListItemDto> result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<PurchaseRequisitionListItemDto>>.Success(result));
    }

    // GET /api/purchase-requisitions/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        PurchaseRequisitionDetailDto? requisition = await _service.GetByIdAsync(id);
        if (requisition is null) return NotFound(ApiResponse<string>.Failure("Purchase requisition not found."));
        return Ok(ApiResponse<PurchaseRequisitionDetailDto>.Success(requisition));
    }

    // POST /api/purchase-requisitions
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseRequisitionDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(ApiResponse<string>.Failure("At least one item is required."));

        int newId = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = newId },
            ApiResponse<object>.Success(new { PurchaseRequisitionId = newId }));
    }

    // PUT /api/purchase-requisitions/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePurchaseRequisitionDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(ApiResponse<string>.Failure("At least one item is required."));

        bool updated = await _service.UpdateAsync(id, dto);
        if (!updated) return NotFound(ApiResponse<string>.Failure("Purchase requisition not found."));
        return Ok(ApiResponse<string>.Success("Purchase requisition updated successfully."));
    }

    // DELETE /api/purchase-requisitions/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        bool deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound(ApiResponse<string>.Failure("Purchase requisition not found."));
        return Ok(ApiResponse<string>.Success("Purchase requisition deleted successfully."));
    }
}

using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.WebApi.Controllers.Sales;

[ApiController]
[Route("api/estimations")]
public class EstimationController : ControllerBase
{
    private readonly IEstimationService _service;

    public EstimationController(IEstimationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] EstimationFilterDto filter)
    {
        var errors = SalesValidation.ValidateFilter(filter.PageNumber, filter.PageSize, filter.FromDate, filter.ToDate, filter.Search);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid filter.", errors));

        var result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<EstimationListItemDto>>.Success(result));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var estimation = await _service.GetByIdAsync(id);
        if (estimation is null)
            return NotFound(ApiResponse<string>.Failure("Estimation not found."));

        return Ok(ApiResponse<EstimationDetailDto>.Success(estimation));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEstimationDto dto)
    {
        var errors = SalesValidation.Validate(dto);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid estimation.", errors));

        var newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { EstimationId = newId }));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEstimationDto dto)
    {
        var errors = SalesValidation.Validate(dto);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid estimation.", errors));

        var updated = await _service.UpdateAsync(id, dto);
        if (!updated)
            return NotFound(ApiResponse<string>.Failure("Estimation not found."));

        return Ok(ApiResponse<string>.Success("Estimation updated successfully."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound(ApiResponse<string>.Failure("Estimation not found."));

        return Ok(ApiResponse<string>.Success("Estimation deleted successfully."));
    }
}

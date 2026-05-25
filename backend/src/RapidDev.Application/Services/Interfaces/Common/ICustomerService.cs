using RapidDev.Application.DTOs.Common;

namespace RapidDev.Application.Services.Interfaces.Common;

public interface ICustomerService
{
    Task<IEnumerable<CustomerDto>> GetAllAsync();
}

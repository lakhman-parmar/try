using RapidDev.Application.DTOs.Common;

namespace RapidDev.Application.Interfaces.Repositories.Common;

public interface ICustomerRepository
{
    Task<IEnumerable<CustomerDto>> GetAllAsync();
}

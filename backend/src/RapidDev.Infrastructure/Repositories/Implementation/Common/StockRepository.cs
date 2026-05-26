using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Stock;
using RapidDev.Application.Interfaces.Repositories.Stock;

namespace RapidDev.Infrastructure.Repositories.Implementation.Stock;

public class StockRepository(IConfiguration configuration) : IStockRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<StockListItemDto>> GetAllAsync(StockFilterDto filter)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@Search",     filter.Search);
        parameters.Add("@PageNumber", filter.PageNumber);
        parameters.Add("@PageSize",   filter.PageSize);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        IEnumerable<StockListItemDto> items = await conn.QueryAsync<StockListItemDto>(
            "usp_Stock_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<StockListItemDto>
        {
            Items      = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize   = filter.PageSize
        };
    }

    public async Task<StockDetailDto?> GetByIdAsync(int productId)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@product_id", productId);

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_Stock_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        StockDetailDto? header = await multi.ReadFirstOrDefaultAsync<StockDetailDto>();
        if (header is null) return null;

        header.Movements = await multi.ReadAsync<StockMovementDto>();
        return header;
    }
}

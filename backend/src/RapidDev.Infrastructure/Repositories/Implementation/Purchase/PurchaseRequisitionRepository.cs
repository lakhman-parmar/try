using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Purchase;

namespace RapidDev.Infrastructure.Repositories.Implementation.Purchase;

public class PurchaseRequisitionRepository : IPurchaseRequisitionRepository
{
    private readonly string _connectionString;

    public PurchaseRequisitionRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<PurchaseRequisitionListItemDto>> GetAllAsync(PurchaseRequisitionFilterDto filter)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@Search", filter.Search);
        parameters.Add("@FromDate", filter.FromDate);
        parameters.Add("@ToDate", filter.ToDate);
        parameters.Add("@PageNumber", filter.PageNumber);
        parameters.Add("@PageSize", filter.PageSize);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        IEnumerable<PurchaseRequisitionListItemDto> items = await conn.QueryAsync<PurchaseRequisitionListItemDto>(
            "usp_PurchaseRequisition_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<PurchaseRequisitionListItemDto>
        {
            Items = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<PurchaseRequisitionDetailDto?> GetByIdAsync(int id)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@purchase_requisition_id", id);

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_PurchaseRequisition_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        PurchaseRequisitionDetailDto? header = await multi.ReadFirstOrDefaultAsync<PurchaseRequisitionDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<PurchaseRequisitionItemDetailDto>();
        return header;
    }

    public async Task<int> CreateAsync(CreatePurchaseRequisitionDto dto)
    {
        using IDbConnection conn = CreateConnection();

        DataTable itemsTable = BuildItemsTvp(dto.Items);

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", itemsTable.AsTableValuedParameter("dbo.udt_purchase_requisition_item"));

        int newId = await conn.QuerySingleAsync<int>(
            "usp_PurchaseRequisition_Create",
            parameters,
            commandType: CommandType.StoredProcedure);

        return newId;
    }

    public async Task<bool> UpdateAsync(int id, UpdatePurchaseRequisitionDto dto)
    {
        using IDbConnection conn = CreateConnection();

        DataTable itemsTable = BuildItemsTvp(dto.Items);

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@purchase_requisition_id", id);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", itemsTable.AsTableValuedParameter("dbo.udt_purchase_requisition_item"));

        int rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_PurchaseRequisition_Update",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@purchase_requisition_id", id);

        int rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_PurchaseRequisition_Delete",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreatePurchaseRequisitionItemDto> items)
    {
        DataTable table = new DataTable();
        table.Columns.Add("ProductId", typeof(int));
        table.Columns.Add("Quantity", typeof(decimal));

        foreach (CreatePurchaseRequisitionItemDto item in items)
            table.Rows.Add(item.ProductId, item.Quantity);

        return table;
    }
}

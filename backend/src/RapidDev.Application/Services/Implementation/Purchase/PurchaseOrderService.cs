using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.Application.Services.Implementation.Purchase;

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly string _connectionString;

    public PurchaseOrderService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<PurchaseOrderListItemDto>> GetAllAsync(PurchaseOrderFilterDto filter)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@Search", filter.Search);
        parameters.Add("@FromDate", filter.FromDate);
        parameters.Add("@ToDate", filter.ToDate);
        parameters.Add("@SupplierId", filter.SupplierId);
        parameters.Add("@PageNumber", filter.PageNumber);
        parameters.Add("@PageSize", filter.PageSize);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        var items = await conn.QueryAsync<PurchaseOrderListItemDto>(
            "usp_PurchaseOrder_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<PurchaseOrderListItemDto>
        {
            Items = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<PurchaseOrderDetailDto?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@purchase_order_id", id);

        using var multi = await conn.QueryMultipleAsync(
            "usp_PurchaseOrder_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        var header = await multi.ReadFirstOrDefaultAsync<PurchaseOrderDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<PurchaseOrderItemDetailDto>();
        return header;
    }

    public async Task<IEnumerable<RequisitionForPoDto>> GetRequisitionsForPoAsync()
    {
        using var conn = CreateConnection();

        using var multi = await conn.QueryMultipleAsync(
            "usp_PurchaseOrder_GetRequisitionsForPO",
            commandType: CommandType.StoredProcedure);

        var headers = (await multi.ReadAsync<RequisitionForPoDto>()).ToList();
        var allItems = (await multi.ReadAsync<RequisitionItemForPoDto>()).ToList();

        var itemsByRequisition = allItems.GroupBy(i => i.RequisitionId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var header in headers)
        {
            if (itemsByRequisition.TryGetValue(header.PurchaseRequisitionId, out var items))
                header.Items = items;
        }

        return headers;
    }

    public async Task<int> CreateAsync(CreatePurchaseOrderDto dto)
    {
        using var conn = CreateConnection();

        var itemsTable = BuildItemsTvp(dto.Items);

        var parameters = new DynamicParameters();
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", itemsTable.AsTableValuedParameter("dbo.udt_purchase_order_item"));

        var newId = await conn.QuerySingleAsync<int>(
            "usp_PurchaseOrder_Create",
            parameters,
            commandType: CommandType.StoredProcedure);

        return newId;
    }

    public async Task<bool> UpdateAsync(int id, UpdatePurchaseOrderDto dto)
    {
        using var conn = CreateConnection();

        var itemsTable = BuildItemsTvp(dto.Items);

        var parameters = new DynamicParameters();
        parameters.Add("@purchase_order_id", id);
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", itemsTable.AsTableValuedParameter("dbo.udt_purchase_order_item"));

        var rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_PurchaseOrder_Update",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@purchase_order_id", id);

        var rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_PurchaseOrder_Delete",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreatePurchaseOrderItemDto> items)
    {
        var table = new DataTable();
        table.Columns.Add("ProductId", typeof(int));
        table.Columns.Add("RequisitionId", typeof(int));
        table.Columns.Add("RequisitionItemId", typeof(int));
        table.Columns.Add("Quantity", typeof(decimal));
        table.Columns.Add("UnitPrice", typeof(decimal));

        foreach (var item in items)
        {
            var row = table.NewRow();
            row["ProductId"] = item.ProductId;
            row["RequisitionId"] = item.RequisitionId.HasValue ? (object)item.RequisitionId.Value : DBNull.Value;
            row["RequisitionItemId"] = item.RequisitionItemId.HasValue ? (object)item.RequisitionItemId.Value : DBNull.Value;
            row["Quantity"] = item.Quantity;
            row["UnitPrice"] = DBNull.Value;
            table.Rows.Add(row);
        }

        return table;
    }
}

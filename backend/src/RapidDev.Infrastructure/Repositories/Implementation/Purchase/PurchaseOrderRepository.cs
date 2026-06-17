using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Purchase;

namespace RapidDev.Infrastructure.Repositories.Implementation.Purchase;

public class PurchaseOrderRepository(IConfiguration configuration) : IPurchaseOrderRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<PurchaseOrderListItemDto>> GetAllAsync(PurchaseOrderFilterDto filter)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@Search",      filter.Search);
        parameters.Add("@FromDate",    filter.FromDate);
        parameters.Add("@ToDate",      filter.ToDate);
        parameters.Add("@SupplierId",  filter.SupplierId);
        parameters.Add("@PageNumber",  filter.PageNumber);
        parameters.Add("@PageSize",    filter.PageSize);
        parameters.Add("@TotalCount",  dbType: DbType.Int32, direction: ParameterDirection.Output);

        IEnumerable<PurchaseOrderListItemDto> items = await conn.QueryAsync<PurchaseOrderListItemDto>(
            "usp_PurchaseOrder_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<PurchaseOrderListItemDto>
        {
            Items      = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize   = filter.PageSize
        };
    }

    public async Task<PurchaseOrderDetailDto?> GetByIdAsync(int id)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@purchase_order_id", id);

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_PurchaseOrder_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        PurchaseOrderDetailDto? header = await multi.ReadFirstOrDefaultAsync<PurchaseOrderDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<PurchaseOrderItemDetailDto>();
        return header;
    }

    public async Task<PagedResult<RequisitionForPoDto>> GetRequisitionsForPoAsync(int supplierId, int pageNumber = 1, int pageSize = 20)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@supplier_id", supplierId);
        parameters.Add("@PageNumber",  pageNumber);
        parameters.Add("@PageSize",    pageSize);
        parameters.Add("@TotalCount",  dbType: DbType.Int32, direction: ParameterDirection.Output);

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_PurchaseOrder_GetRequisitionsForPO",
            parameters,
            commandType: CommandType.StoredProcedure);

        List<RequisitionForPoDto> headers = (await multi.ReadAsync<RequisitionForPoDto>()).ToList();
        List<RequisitionItemForPoDto> allItems = (await multi.ReadAsync<RequisitionItemForPoDto>()).ToList();

        Dictionary<int, IEnumerable<RequisitionItemForPoDto>> itemsByRequisition = allItems.GroupBy(i => i.RequisitionId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (RequisitionForPoDto header in headers)
        {
            if (itemsByRequisition.TryGetValue(header.PurchaseRequisitionId, out IEnumerable<RequisitionItemForPoDto>? items))
                header.Items = items;
        }

        return new PagedResult<RequisitionForPoDto>
        {
            Items      = headers,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = pageNumber,
            PageSize   = pageSize
        };
    }

    public async Task<int> CreateAsync(CreatePurchaseOrderDto dto)
    {
        using IDbConnection conn = CreateConnection();

        DataTable itemsTable = BuildItemsTvp(dto.Items);

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@supplier_id", dto.SupplierId);
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks",        dto.Remarks);
        parameters.Add("@items",          itemsTable.AsTableValuedParameter("dbo.udt_purchase_order_item"));

        int newId = await conn.QuerySingleAsync<int>(
            "usp_PurchaseOrder_Create",
            parameters,
            commandType: CommandType.StoredProcedure);

        return newId;
    }

    public async Task<bool> UpdateAsync(int id, UpdatePurchaseOrderDto dto)
    {
        using IDbConnection conn = CreateConnection();

        DataTable itemsTable = BuildItemsTvp(dto.Items);

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@purchase_order_id", id);
        parameters.Add("@supplier_id",       dto.SupplierId);
        parameters.Add("@tax_percentage",    dto.TaxPercentage);
        parameters.Add("@remarks",           dto.Remarks);
        parameters.Add("@items",             itemsTable.AsTableValuedParameter("dbo.udt_purchase_order_item"));

        int rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_PurchaseOrder_Update",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@purchase_order_id", id);

        int rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_PurchaseOrder_Delete",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreatePurchaseOrderItemDto> items)
    {
        DataTable table = new DataTable();
        table.Columns.Add("ProductId", typeof(int));
        table.Columns.Add("RequisitionId", typeof(int));
        table.Columns.Add("RequisitionItemId", typeof(int));
        table.Columns.Add("Quantity", typeof(decimal));
        table.Columns.Add("UnitPrice", typeof(decimal));

        foreach (CreatePurchaseOrderItemDto item in items)
        {
            DataRow row = table.NewRow();
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

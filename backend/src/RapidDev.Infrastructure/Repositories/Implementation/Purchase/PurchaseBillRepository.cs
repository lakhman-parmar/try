using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Purchase;

namespace RapidDev.Infrastructure.Repositories.Implementation.Purchase;

public class PurchaseBillRepository(IConfiguration configuration) : IPurchaseBillRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<PurchaseBillListItemDto>> GetAllAsync(PurchaseBillFilterDto filter)
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

        IEnumerable<PurchaseBillListItemDto> items = await conn.QueryAsync<PurchaseBillListItemDto>(
            "usp_PurchaseBill_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<PurchaseBillListItemDto>
        {
            Items      = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize   = filter.PageSize
        };
    }

    public async Task<PurchaseBillDetailDto?> GetByIdAsync(int id)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@purchase_bill_id", id);

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_PurchaseBill_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        PurchaseBillDetailDto? header = await multi.ReadFirstOrDefaultAsync<PurchaseBillDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<PurchaseBillItemDetailDto>();
        return header;
    }

    public async Task<IEnumerable<PurchaseOrderForBillDto>> GetOrdersForBillAsync()
    {
        using IDbConnection conn = CreateConnection();

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_PurchaseBill_GetOrdersForBill",
            commandType: CommandType.StoredProcedure);

        List<PurchaseOrderForBillDto> headers = (await multi.ReadAsync<PurchaseOrderForBillDto>()).ToList();
        List<PurchaseOrderItemForBillDto> allItems = (await multi.ReadAsync<PurchaseOrderItemForBillDto>()).ToList();

        Dictionary<int, IEnumerable<PurchaseOrderItemForBillDto>> itemsByOrder = allItems
            .GroupBy(i => i.PurchaseOrderId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (PurchaseOrderForBillDto header in headers)
        {
            if (itemsByOrder.TryGetValue(header.PurchaseOrderId, out IEnumerable<PurchaseOrderItemForBillDto>? items))
                header.Items = items;
        }

        return headers;
    }

    public async Task<int> CreateAsync(CreatePurchaseBillDto dto)
    {
        using IDbConnection conn = CreateConnection();

        DataTable itemsTable = BuildItemsTvp(dto.Items);

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks",        dto.Remarks);
        parameters.Add("@items",          itemsTable.AsTableValuedParameter("dbo.udt_purchase_bill_item"));

        return await conn.QuerySingleAsync<int>(
            "usp_PurchaseBill_Create",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> RegenerateAsync(int sourceBillId, RegeneratePurchaseBillDto dto)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@source_bill_id", sourceBillId);
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks",        dto.Remarks);

        return await conn.QuerySingleAsync<int>(
            "usp_PurchaseBill_Regenerate",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreatePurchaseBillItemDto> items)
    {
        DataTable table = new DataTable();
        table.Columns.Add("ProductId",            typeof(int));
        table.Columns.Add("PurchaseOrderId",      typeof(int));
        table.Columns.Add("PurchaseOrderItemId",  typeof(int));
        table.Columns.Add("Quantity",             typeof(decimal));
        table.Columns.Add("UnitPrice",            typeof(decimal));

        foreach (CreatePurchaseBillItemDto item in items)
        {
            DataRow row = table.NewRow();
            row["ProductId"]           = item.ProductId;
            row["PurchaseOrderId"]     = item.PurchaseOrderId.HasValue
                                             ? (object)item.PurchaseOrderId.Value : DBNull.Value;
            row["PurchaseOrderItemId"] = item.PurchaseOrderItemId.HasValue
                                             ? (object)item.PurchaseOrderItemId.Value : DBNull.Value;
            row["Quantity"]            = item.Quantity;
            row["UnitPrice"]           = DBNull.Value; // always resolved from product.purchase_price in the SP
            table.Rows.Add(row);
        }

        return table;
    }
}
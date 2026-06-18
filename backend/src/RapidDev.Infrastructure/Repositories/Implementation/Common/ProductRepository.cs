using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Common;

namespace RapidDev.Infrastructure.Repositories.Implementation.Common;

public class ProductRepository(IConfiguration configuration) : IProductRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found.");

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    // ── Purchase-flow helpers ─────────────────────────────────────────────────

    public async Task<IEnumerable<ProductDto>> GetAllAsync(int? supplierId = null)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@supplier_id", supplierId);
        return await conn.QueryAsync<ProductDto>("sp_GetAllProducts", p, commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<SupplierDto>> GetSuppliersAsync()
    {
        using IDbConnection conn = CreateConnection();
        return await conn.QueryAsync<SupplierDto>("sp_GetAllSuppliers", commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<SupplierProductDto>> GetSuppliersByProductAsync(int productId)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@product_id", productId);
        return await conn.QueryAsync<SupplierProductDto>("usp_SupplierProduct_GetByProduct", p, commandType: CommandType.StoredProcedure);
    }

    public async Task<int> UpsertSupplierProductAsync(UpsertSupplierProductDto dto)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@product_id",     dto.ProductId);
        p.Add("@supplier_id",    dto.SupplierId);
        p.Add("@purchase_price", dto.PurchasePrice);
        return await conn.QuerySingleAsync<int>("usp_SupplierProduct_Upsert", p, commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> DeleteSupplierProductAsync(int supplierProductId)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@supplier_product_id", supplierProductId);
        int rows = await conn.QuerySingleAsync<int>("usp_SupplierProduct_Delete", p, commandType: CommandType.StoredProcedure);
        return rows > 0;
    }

    // ── Product CRUD ──────────────────────────────────────────────────────────

    public async Task<PagedResult<ProductListItemDto>> GetProductsPagedAsync(ProductFilterDto filter)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@Search",     filter.Search);
        p.Add("@PageNumber", filter.PageNumber);
        p.Add("@PageSize",   filter.PageSize);
        p.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        IEnumerable<ProductListItemDto> items = await conn.QueryAsync<ProductListItemDto>(
            "usp_Product_GetAll", p, commandType: CommandType.StoredProcedure);

        return new PagedResult<ProductListItemDto>
        {
            Items      = items,
            TotalCount = p.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize   = filter.PageSize
        };
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(int productId)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@product_id", productId);

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_Product_GetById", p, commandType: CommandType.StoredProcedure);

        ProductDetailDto? header = await multi.ReadFirstOrDefaultAsync<ProductDetailDto>();
        if (header is null) return null;
        header.Suppliers = await multi.ReadAsync<SupplierProductDto>();
        return header;
    }

    public async Task<int> CreateProductAsync(CreateProductDto dto)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@name",          dto.Name);
        p.Add("@description",   dto.Description);
        p.Add("@selling_price", dto.SellingPrice);
        p.Add("@unit_id",       dto.UnitId);
        p.Add("@image_url",     dto.ImageUrl);
        return await conn.QuerySingleAsync<int>("usp_Product_Create", p, commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> UpdateProductAsync(int productId, UpdateProductDto dto)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@product_id",    productId);
        p.Add("@name",          dto.Name);
        p.Add("@description",   dto.Description);
        p.Add("@selling_price", dto.SellingPrice);
        p.Add("@unit_id",       dto.UnitId);
        p.Add("@image_url",     dto.ImageUrl);
        int rows = await conn.QuerySingleAsync<int>("usp_Product_Update", p, commandType: CommandType.StoredProcedure);
        return rows > 0;
    }

    public async Task<bool> DeleteProductAsync(int productId)
    {
        using IDbConnection conn = CreateConnection();
        DynamicParameters p = new();
        p.Add("@product_id", productId);
        int rows = await conn.QuerySingleAsync<int>("usp_Product_Delete", p, commandType: CommandType.StoredProcedure);
        return rows > 0;
    }

    public async Task<IEnumerable<UnitDto>> GetAllUnitsAsync()
    {
        using IDbConnection conn = CreateConnection();
        return await conn.QueryAsync<UnitDto>("sp_GetAllUnits", commandType: CommandType.StoredProcedure);
    }
}

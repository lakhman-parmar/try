CREATE OR ALTER PROCEDURE [dbo].[usp_Product_GetById]
    @product_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result 1: product header
    SELECT
        p.product_id   AS ProductId,
        p.name         AS Name,
        p.description  AS Description,
        p.selling_price AS SellingPrice,
        p.stock        AS Stock,
        u.unit_id      AS UnitId,
        u.short_name   AS UnitShortName,
        p.image_url    AS ImageUrl,
        p.created_at   AS CreatedAt,
        p.modified_at  AS ModifiedAt
    FROM   [product] p
    LEFT JOIN [unit] u ON u.unit_id = p.unit_id
    WHERE  p.product_id = @product_id AND p.is_deleted = 0;

    -- Result 2: supplier mappings with per-supplier price
    SELECT
        sp.supplier_product_id AS SupplierProductId,
        sp.supplier_id         AS SupplierId,
        s.name                 AS SupplierName,
        sp.purchase_price      AS PurchasePrice
    FROM   dbo.supplier_product sp
    INNER JOIN dbo.supplier s ON s.supplier_id = sp.supplier_id
    WHERE  sp.product_id = @product_id AND sp.is_deleted = 0
    ORDER  BY s.name;
END;
GO

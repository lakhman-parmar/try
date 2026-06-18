CREATE OR ALTER PROCEDURE [dbo].[usp_Product_GetAll]
    @Search     NVARCHAR(500) = NULL,
    @PageNumber INT           = 1,
    @PageSize   INT           = 20,
    @TotalCount INT           OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount = COUNT(*)
    FROM   [product] p
    WHERE  p.is_deleted = 0
      AND  (@Search IS NULL OR p.name LIKE '%' + @Search + '%');

    SELECT
        p.product_id   AS ProductId,
        p.name         AS Name,
        p.description  AS Description,
        p.selling_price AS SellingPrice,
        (SELECT MIN(sp.purchase_price)
         FROM dbo.supplier_product sp
         WHERE sp.product_id = p.product_id AND sp.is_deleted = 0) AS MinPurchasePrice,
        p.stock        AS Stock,
        u.unit_id      AS UnitId,
        u.short_name   AS UnitShortName,
        p.image_url    AS ImageUrl,
        p.created_at   AS CreatedAt,
        p.modified_at  AS ModifiedAt
    FROM   [product] p
    LEFT JOIN [unit] u ON u.unit_id = p.unit_id
    WHERE  p.is_deleted = 0
      AND  (@Search IS NULL OR p.name LIKE '%' + @Search + '%')
    ORDER  BY p.name
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

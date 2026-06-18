USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SupplierProduct_GetByProduct]
    @product_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        sp.supplier_product_id AS SupplierProductId,
        sp.product_id AS ProductId,
        sp.supplier_id AS SupplierId,
        s.name AS SupplierName,
        sp.purchase_price AS PurchasePrice,
        sp.created_at AS CreatedAt,
        sp.modified_at AS ModifiedAt
    FROM dbo.supplier_product sp
    INNER JOIN dbo.supplier s ON s.supplier_id = sp.supplier_id
    WHERE sp.product_id = @product_id
      AND sp.is_deleted = 0
    ORDER BY s.name;
END
GO

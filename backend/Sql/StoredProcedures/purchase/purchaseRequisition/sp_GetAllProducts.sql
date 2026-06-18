USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [dbo].[sp_GetAllProducts]
    @supplier_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.product_id AS ProductId,
        p.name AS Name,
        p.description AS Description,
        p.selling_price AS SellingPrice,
        CASE 
            WHEN @supplier_id IS NOT NULL THEN (
                SELECT TOP 1 sp.purchase_price 
                FROM dbo.supplier_product sp 
                WHERE sp.product_id = p.product_id 
                  AND sp.supplier_id = @supplier_id 
                  AND sp.is_deleted = 0
            )
            ELSE (
                SELECT MIN(sp.purchase_price) 
                FROM dbo.supplier_product sp 
                WHERE sp.product_id = p.product_id 
                  AND sp.is_deleted = 0
            )
        END AS PurchasePrice,
        p.stock AS Stock,
        u.short_name AS UnitShortName
    FROM dbo.product p
    LEFT JOIN dbo.unit u ON p.unit_id = u.unit_id
    WHERE (p.is_deleted = 0 OR p.is_deleted IS NULL)
      AND (@supplier_id IS NULL OR EXISTS (
          SELECT 1
          FROM dbo.supplier_product sp
          WHERE sp.product_id = p.product_id
            AND sp.supplier_id = @supplier_id
            AND sp.is_deleted = 0
      ))
    ORDER BY p.name;
END
GO
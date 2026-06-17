USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseBill_GetOrdersForBill]
    @supplier_id INT,
    @PageNumber  INT = 1,
    @PageSize    INT = 20,
    @TotalCount  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Total count for pagination
    SELECT @TotalCount = COUNT(DISTINCT po.purchase_order_id)
    FROM dbo.purchase_order po
    WHERE po.is_deleted = 0
      AND po.supplier_id = @supplier_id
      AND EXISTS (
          SELECT 1
          FROM dbo.purchase_order_item poi
          WHERE poi.purchase_order_id = po.purchase_order_id
            AND poi.is_deleted = 0
      );

    -- Paginated order IDs into temp table
    SELECT purchase_order_id, created_at
    INTO #paginated
    FROM (
        SELECT DISTINCT po.purchase_order_id, po.created_at
        FROM dbo.purchase_order po
        WHERE po.is_deleted = 0
          AND po.supplier_id = @supplier_id
          AND EXISTS (
              SELECT 1
              FROM dbo.purchase_order_item poi
              WHERE poi.purchase_order_id = po.purchase_order_id
                AND poi.is_deleted = 0
          )
    ) AS base
    ORDER BY base.created_at DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Purchase order headers
    SELECT DISTINCT
        po.purchase_order_id,
        po.po_number,
        po.supplier_id,
        s.name AS supplier_name,
        po.tax_percentage,
        po.remarks,
        po.created_at
    FROM dbo.purchase_order po
    INNER JOIN #paginated pg ON pg.purchase_order_id = po.purchase_order_id
    LEFT JOIN dbo.supplier s ON s.supplier_id = po.supplier_id;

    -- Items for paginated orders
    SELECT
        poi.purchase_order_item_id,
        poi.purchase_order_id,
        poi.product_id,
        prod.name AS product_name,
        u.short_name AS unit_short_name,
        poi.quantity,
        poi.unit_price,
        poi.requisition_id,
        pr.requisition_no,
        poi.requisition_item_id
    FROM dbo.purchase_order_item poi
    INNER JOIN #paginated pg ON pg.purchase_order_id = poi.purchase_order_id
    INNER JOIN dbo.product prod ON prod.product_id = poi.product_id
    LEFT JOIN dbo.unit u ON u.unit_id = prod.unit_id
    LEFT JOIN dbo.purchase_requisition pr
        ON pr.purchase_requisition_id = poi.requisition_id
    WHERE poi.is_deleted = 0;

    DROP TABLE #paginated;
END
GO

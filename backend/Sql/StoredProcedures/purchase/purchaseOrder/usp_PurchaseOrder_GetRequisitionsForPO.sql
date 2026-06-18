USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_GetRequisitionsForPO]
    @supplier_id INT,
    @PageNumber  INT = 1,
    @PageSize    INT = 20,
    @TotalCount  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Total count for pagination
    SELECT @TotalCount = COUNT(DISTINCT pr.purchase_requisition_id)
    FROM dbo.purchase_requisition pr
    INNER JOIN dbo.purchase_requisition_item pri
        ON pri.requisition_id = pr.purchase_requisition_id
       AND pri.is_deleted = 0
    WHERE pr.is_deleted = 0
      AND pr.supplier_id = @supplier_id;

    -- Paginated requisition IDs into temp table
    SELECT purchase_requisition_id, created_at
    INTO #paginated
    FROM (
        SELECT DISTINCT pr.purchase_requisition_id, pr.created_at
        FROM dbo.purchase_requisition pr
        INNER JOIN dbo.purchase_requisition_item pri
            ON pri.requisition_id = pr.purchase_requisition_id
           AND pri.is_deleted = 0
        WHERE pr.is_deleted = 0
          AND pr.supplier_id = @supplier_id
    ) AS base
    ORDER BY base.created_at DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Requisition headers
    SELECT DISTINCT
        pr.purchase_requisition_id,
        pr.requisition_no,
        pr.supplier_id,
        s.name AS supplier_name,
        pr.remarks,
        pr.created_at
    FROM dbo.purchase_requisition pr
    INNER JOIN #paginated pg ON pg.purchase_requisition_id = pr.purchase_requisition_id
    LEFT JOIN dbo.supplier s ON s.supplier_id = pr.supplier_id;

    -- Items for paginated requisitions
    SELECT
        pri.purchase_requisition_item_id,
        pri.requisition_id,
        pri.product_id,
        p.name AS product_name,
        sp.purchase_price AS unit_price,
        u.short_name AS unit_short_name,
        pri.quantity
    FROM dbo.purchase_requisition_item pri
    INNER JOIN #paginated pg ON pg.purchase_requisition_id = pri.requisition_id
    INNER JOIN dbo.product p ON p.product_id = pri.product_id
    LEFT JOIN dbo.supplier_product sp 
        ON sp.product_id = p.product_id 
       AND sp.supplier_id = @supplier_id 
       AND sp.is_deleted = 0
    LEFT JOIN dbo.unit u ON u.unit_id = p.unit_id
    WHERE pri.is_deleted = 0
    ORDER BY pri.requisition_id, pri.purchase_requisition_item_id;

    DROP TABLE #paginated;
END
GO

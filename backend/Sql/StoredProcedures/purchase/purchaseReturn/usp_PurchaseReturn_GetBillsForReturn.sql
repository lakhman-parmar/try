-- ============================================================
-- Stored Procedure: usp_PurchaseReturn_GetBillsForReturn
-- Returns purchase bills that have at least one item with
-- remaining returnable quantity > 0.
-- Result set 1: Bill headers (paginated)
-- Result set 2: Bill items with remaining_quantity column
--               (billed - already returned) for the current page.
-- The frontend uses this to populate the return creation form.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseReturn_GetBillsForReturn]
       @PageNumber INT = 1,
       @PageSize   INT = 20,
       @TotalCount INT OUTPUT
AS
BEGIN
       SET NOCOUNT ON;

       -- Compute per-item already-returned quantities
       SELECT
              pbi.purchase_bill_item_id,
              ISNULL(SUM(pri.quantity), 0) AS returned_quantity
       INTO #returned
       FROM dbo.purchase_bill_item pbi
              LEFT JOIN dbo.purchase_return_item pri
              ON pri.purchase_bill_item_id = pbi.purchase_bill_item_id
                     AND pri.is_deleted             = 0
              LEFT JOIN dbo.purchase_return pr
              ON pr.purchase_return_id = pri.purchase_return_id
                     AND pr.is_deleted         = 0
       WHERE  pbi.is_deleted = 0
       GROUP BY pbi.purchase_bill_item_id;

       -- Identify bill IDs with returnable items
       SELECT DISTINCT
              pb.purchase_bill_id
       INTO #paginated
       FROM dbo.purchase_bill pb
              INNER JOIN dbo.purchase_bill_item pbi
              ON pbi.purchase_bill_id = pb.purchase_bill_id
                     AND pbi.is_deleted       = 0
              INNER JOIN #returned r
              ON r.purchase_bill_item_id = pbi.purchase_bill_item_id
       WHERE  pb.is_deleted = 0
              AND (pbi.quantity - r.returned_quantity) > 0;

       -- Total count for pagination
       SELECT @TotalCount = COUNT(*)
       FROM #paginated;

       -- Result set 1: Bill headers (paginated)
       SELECT
              pb.purchase_bill_id,
              pb.bill_number,
              pb.supplier_id,
              s.name          AS supplier_name,
              pb.tax_percentage,
              pb.total_amount,
              pb.created_at
       FROM #paginated p
              INNER JOIN dbo.purchase_bill pb
              ON pb.purchase_bill_id = p.purchase_bill_id
              LEFT JOIN dbo.supplier s
              ON s.supplier_id = pb.supplier_id
       ORDER BY pb.created_at DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

       -- Result set 2: Items for the paginated bill headers only
       SELECT
              pbi.purchase_bill_item_id,
              pbi.purchase_bill_id,
              pbi.product_id,
              prd.name                               AS product_name,
              u.short_name                           AS unit_short_name,
              pbi.quantity                           AS billed_quantity,
              r.returned_quantity,
              (pbi.quantity - r.returned_quantity)   AS remaining_quantity,
              pbi.unit_price
       FROM #paginated p
              INNER JOIN dbo.purchase_bill_item pbi
              ON pbi.purchase_bill_id = p.purchase_bill_id
                     AND pbi.is_deleted       = 0
              INNER JOIN dbo.product prd
              ON prd.product_id = pbi.product_id
              LEFT JOIN dbo.unit u
              ON u.unit_id = prd.unit_id
              INNER JOIN #returned r
              ON r.purchase_bill_item_id = pbi.purchase_bill_item_id
       WHERE  (pbi.quantity - r.returned_quantity) > 0
       ORDER BY pbi.purchase_bill_item_id;

DROP TABLE #returned; 
DROP TABLE #paginated; 
END 
GO
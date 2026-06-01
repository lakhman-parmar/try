-- ============================================================
-- Stored Procedure: usp_PurchaseReturn_GetBillsForReturn
-- Returns purchase bills that have at least one item with
-- remaining returnable quantity > 0.
-- Result set 1: Bill headers
-- Result set 2: Bill items with remaining_quantity column
--               (billed - already returned).
-- The frontend uses this to populate the return creation form.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseReturn_GetBillsForReturn]
AS
BEGIN
    SET NOCOUNT ON;

    -- Compute per-item already-returned quantities
    -- into a temp table for reuse in both result sets.
    SELECT
        pbi.purchase_bill_item_id,
        ISNULL(SUM(pri.quantity), 0) AS returned_quantity
    INTO #returned
    FROM   dbo.purchase_bill_item pbi
    LEFT  JOIN dbo.purchase_return_item pri
           ON pri.purchase_bill_item_id = pbi.purchase_bill_item_id
          AND pri.is_deleted             = 0
    LEFT  JOIN dbo.purchase_return pr
           ON pr.purchase_return_id = pri.purchase_return_id
          AND pr.is_deleted         = 0
    WHERE  pbi.is_deleted = 0
    GROUP BY pbi.purchase_bill_item_id;

    -- Result set 1: Bill headers that still have returnable items
    SELECT DISTINCT
        pb.purchase_bill_id,
        pb.bill_number,
        pb.supplier_id,
        s.name          AS supplier_name,
        pb.tax_percentage,
        pb.total_amount,
        pb.created_at
    FROM   dbo.purchase_bill pb
    LEFT  JOIN dbo.supplier s
           ON s.supplier_id = pb.supplier_id
    INNER JOIN dbo.purchase_bill_item pbi
           ON pbi.purchase_bill_id = pb.purchase_bill_id
          AND pbi.is_deleted       = 0
    INNER JOIN #returned r
           ON r.purchase_bill_item_id = pbi.purchase_bill_item_id
    WHERE  pb.is_deleted = 0
      AND  (pbi.quantity - r.returned_quantity) > 0
    ORDER BY pb.created_at DESC;

    -- Result set 2: Individual bill items with remaining returnable qty
    SELECT
        pbi.purchase_bill_item_id,
        pbi.purchase_bill_id,
        pbi.product_id,
        p.name                              AS product_name,
        u.short_name                        AS unit_short_name,
        pbi.quantity                        AS billed_quantity,
        r.returned_quantity,
        (pbi.quantity - r.returned_quantity) AS remaining_quantity,
        pbi.unit_price
    FROM   dbo.purchase_bill_item pbi
    INNER JOIN dbo.product p
           ON p.product_id = pbi.product_id
    LEFT  JOIN dbo.unit u
           ON u.unit_id = p.unit_id
    INNER JOIN #returned r
           ON r.purchase_bill_item_id = pbi.purchase_bill_item_id
    INNER JOIN dbo.purchase_bill pb
           ON pb.purchase_bill_id = pbi.purchase_bill_id
          AND pb.is_deleted       = 0
    WHERE  pbi.is_deleted                         = 0
      AND  (pbi.quantity - r.returned_quantity)   > 0;

    DROP TABLE #returned;
END
GO

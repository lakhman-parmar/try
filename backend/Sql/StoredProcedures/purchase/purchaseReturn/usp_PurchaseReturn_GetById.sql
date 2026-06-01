-- ============================================================
-- Stored Procedure: usp_PurchaseReturn_GetById
-- Returns 2 result sets:
--   1st: Return header
--   2nd: Return line items (with product, unit, and bill traceability)
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseReturn_GetById]
    @purchase_return_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: Header
    SELECT
        pr.purchase_return_id,
        pr.purchase_return_number,
        pr.supplier_id,
        s.name          AS supplier_name,
        pr.total_amount,
        pr.remarks,
        pr.created_at,
        pr.modified_at
    FROM   dbo.purchase_return pr
    LEFT  JOIN dbo.supplier s ON s.supplier_id = pr.supplier_id
    WHERE  pr.purchase_return_id = @purchase_return_id
      AND  pr.is_deleted         = 0;

    -- Result set 2: Line items
    SELECT
        pri.purchase_return_item_id,
        pri.product_id,
        p.name                   AS product_name,
        u.short_name             AS unit_short_name,
        pri.quantity,
        pri.unit_price,
        -- Bill traceability
        pri.purchase_bill_id,
        pb.bill_number,
        pri.purchase_bill_item_id
    FROM   dbo.purchase_return_item pri
    INNER JOIN dbo.product p
           ON p.product_id = pri.product_id
    LEFT  JOIN dbo.unit u
           ON u.unit_id = p.unit_id
    LEFT  JOIN dbo.purchase_bill pb
           ON pb.purchase_bill_id = pri.purchase_bill_id
    WHERE  pri.purchase_return_id = @purchase_return_id
      AND  pri.is_deleted          = 0;
END
GO

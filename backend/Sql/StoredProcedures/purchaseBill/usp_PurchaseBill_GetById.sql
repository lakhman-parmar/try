-- ============================================================
-- Stored Procedure: usp_PurchaseBill_GetById
-- Returns 2 result sets:
--   1st: Bill header
--   2nd: Bill line items (with product, unit, and PO/requisition traceability)
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseBill_GetById]
    @purchase_bill_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Result set 1: Header ────────────────────────────────────────────
    SELECT
        pb.purchase_bill_id,
        pb.bill_number,
        pb.supplier_id,
        s.name          AS supplier_name,
        pb.tax_percentage,
        pb.total_amount,
        pb.remarks,
        pb.created_at,
        pb.modified_at
    FROM   dbo.purchase_bill pb
    LEFT  JOIN dbo.supplier s ON s.supplier_id = pb.supplier_id
    WHERE  pb.purchase_bill_id = @purchase_bill_id
      AND  pb.is_deleted = 0;

    -- ── Result set 2: Line items ────────────────────────────────────────
    SELECT
        pbi.purchase_bill_item_id,
        pbi.product_id,
        p.name                  AS product_name,
        u.short_name            AS unit_short_name,
        pbi.quantity,
        pbi.unit_price,
        -- PO traceability
        pbi.purchase_order_id,
        po.po_number,
        pbi.purchase_order_item_id,
        -- Requisition traceability (via the purchase_order_item link)
        poi.requisition_id,
        pr.requisition_no,
        poi.requisition_item_id
    FROM   dbo.purchase_bill_item pbi
    INNER JOIN dbo.product p
           ON p.product_id = pbi.product_id
    LEFT  JOIN dbo.unit u
           ON u.unit_id = p.unit_id
    LEFT  JOIN dbo.purchase_order po
           ON po.purchase_order_id = pbi.purchase_order_id
    LEFT  JOIN dbo.purchase_order_item poi
           ON poi.purchase_order_item_id = pbi.purchase_order_item_id
    LEFT  JOIN dbo.purchase_requisition pr
           ON pr.purchase_requisition_id = poi.requisition_id
    WHERE  pbi.purchase_bill_id = @purchase_bill_id
      AND  pbi.is_deleted = 0;
END
GO

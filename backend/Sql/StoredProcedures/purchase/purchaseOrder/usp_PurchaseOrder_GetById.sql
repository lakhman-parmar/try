-- ============================================================
-- Stored Procedure: usp_PurchaseOrder_GetById
-- Returns 2 result sets:
--   1st: PO header
--   2nd: PO line items (with product, unit, and requisition traceability)
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_GetById]
    @purchase_order_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: Header
    SELECT
        po.purchase_order_id,
        po.po_number,
        po.supplier_id,
        s.name          AS supplier_name,
        po.tax_percentage,
        po.remarks,
        po.created_at,
        po.modified_at
    FROM   dbo.purchase_order po
    LEFT  JOIN dbo.supplier s ON s.supplier_id = po.supplier_id
    WHERE  po.purchase_order_id = @purchase_order_id
      AND  po.is_deleted = 0;

    -- Result set 2: Line items
    SELECT
        poi.purchase_order_item_id,
        poi.product_id,
        p.name              AS product_name,
        u.short_name        AS unit_short_name,
        poi.quantity,
        poi.unit_price,
        -- Requisition traceability
        poi.requisition_id,
        pr.requisition_no,
        poi.requisition_item_id
    FROM   dbo.purchase_order_item poi
    INNER JOIN dbo.product p
           ON p.product_id = poi.product_id
    LEFT  JOIN dbo.unit u
           ON u.unit_id    = p.unit_id
    LEFT  JOIN dbo.purchase_requisition pr
           ON pr.purchase_requisition_id = poi.requisition_id
    WHERE  poi.purchase_order_id = @purchase_order_id
      AND  poi.is_deleted = 0;
END
GO

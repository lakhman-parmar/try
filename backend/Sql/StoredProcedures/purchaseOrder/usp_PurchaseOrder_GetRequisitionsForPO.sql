-- ============================================================
-- Stored Procedure: usp_PurchaseOrder_GetRequisitionsForPO
-- Returns all open requisitions (not yet fully ordered) with
-- their items, so the UI can pre-fill a new Purchase Order.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_GetRequisitionsForPO]
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Result set 1: Requisition headers ───────────────────────────────
    SELECT DISTINCT
        pr.purchase_requisition_id,
        pr.requisition_no,
        pr.remarks,
        pr.created_at
    FROM   dbo.purchase_requisition pr
    INNER JOIN dbo.purchase_requisition_item pri
           ON pri.requisition_id = pr.purchase_requisition_id
          AND pri.is_deleted = 0
    WHERE  pr.is_deleted = 0
    ORDER BY pr.created_at DESC;

    -- ── Result set 2: All items of those requisitions ───────────────────
    SELECT
        pri.purchase_requisition_item_id,
        pri.requisition_id,
        pri.product_id,
        p.name          AS product_name,
        p.purchase_price AS unit_price,      -- default price hint for the PO
        u.short_name    AS unit_short_name,
        pri.quantity
    FROM   dbo.purchase_requisition_item pri
    INNER JOIN dbo.purchase_requisition pr
           ON pr.purchase_requisition_id = pri.requisition_id
          AND pr.is_deleted = 0
    INNER JOIN dbo.product p
           ON p.product_id = pri.product_id
    LEFT  JOIN dbo.unit u
           ON u.unit_id    = p.unit_id
    WHERE  pri.is_deleted = 0
    ORDER BY pri.requisition_id, pri.purchase_requisition_item_id;
END
GO

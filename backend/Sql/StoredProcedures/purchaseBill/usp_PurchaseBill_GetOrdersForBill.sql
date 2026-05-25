CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseBill_GetOrdersForBill]
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Result set 1: PO headers ────────────────────────────────────────
    SELECT DISTINCT
        po.purchase_order_id,
        po.po_number,
        po.supplier_id,
        s.name          AS supplier_name,
        po.tax_percentage,
        po.remarks,
        po.created_at
    FROM   dbo.purchase_order po
    LEFT  JOIN dbo.supplier s ON s.supplier_id = po.supplier_id
    WHERE  po.is_deleted = 0
      AND EXISTS (
          SELECT 1
          FROM   dbo.purchase_order_item poi
          WHERE  poi.purchase_order_id = po.purchase_order_id
            AND  poi.is_deleted = 0
      )
    ORDER BY po.created_at DESC;

    -- ── Result set 2: PO items ──────────────────────────────────────────
    SELECT
        poi.purchase_order_item_id,
        poi.purchase_order_id,
        poi.product_id,
        p.name              AS product_name,
        u.short_name        AS unit_short_name,
        poi.quantity,
        poi.unit_price,
        poi.requisition_id,
        pr.requisition_no,
        poi.requisition_item_id
    FROM   dbo.purchase_order_item poi
    INNER JOIN dbo.purchase_order po
           ON po.purchase_order_id = poi.purchase_order_id
          AND po.is_deleted = 0
    INNER JOIN dbo.product p
           ON p.product_id = poi.product_id
    LEFT  JOIN dbo.unit u
           ON u.unit_id = p.unit_id
    LEFT  JOIN dbo.purchase_requisition pr
           ON pr.purchase_requisition_id = poi.requisition_id
    WHERE  poi.is_deleted = 0;
END
GO
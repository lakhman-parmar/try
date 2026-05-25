-- ============================================================
-- Stored Procedure: usp_SalesOrder_GetById
-- Returns 2 result sets:
--   1st: SO header
--   2nd: SO line items (with product, unit, and estimation traceability)
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesOrder_GetById]
    @sales_order_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Result set 1: Header ───────────────────────────────────────────
    SELECT
        so.sales_order_id,
        so.sales_order_number,
        so.customer_id,
        c.name          AS customer_name,
        so.tax_percentage,
        so.remarks,
        so.created_at,
        so.modified_at
    FROM   dbo.sales_order so
    LEFT  JOIN dbo.customer c ON c.customer_id = so.customer_id
    WHERE  so.sales_order_id = @sales_order_id
      AND  so.is_deleted = 0;

    -- ── Result set 2: Line items ───────────────────────────────────────
    SELECT
        soi.sales_order_item_id,
        soi.product_id,
        p.name              AS product_name,
        u.short_name        AS unit_short_name,
        soi.quantity,
        soi.unit_price,
        -- Estimation traceability
        soi.estimation_id,
        e.estimation_number,
        soi.estimation_item_id
    FROM   dbo.sales_order_item soi
    INNER JOIN dbo.product p
            ON p.product_id = soi.product_id
    LEFT  JOIN dbo.unit u
            ON u.unit_id    = p.unit_id
    LEFT  JOIN dbo.estimation e
            ON e.estimation_id = soi.estimation_id
    WHERE  soi.sales_order_id = @sales_order_id
      AND  soi.is_deleted = 0;
END
GO

-- ============================================================
-- Stored Procedure: usp_SalesInvoice_GetOrdersForInvoice
-- Returns sales orders and items that can be used to create invoices.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_GetOrdersForInvoice]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
        so.sales_order_id,
        so.sales_order_number,
        so.customer_id,
        c.name AS customer_name,
        so.tax_percentage,
        so.remarks,
        so.created_at
    FROM dbo.sales_order so
    LEFT JOIN dbo.customer c ON c.customer_id = so.customer_id
    WHERE so.is_deleted = 0
      AND EXISTS (
          SELECT 1
          FROM dbo.sales_order_item soi
          WHERE soi.sales_order_id = so.sales_order_id
            AND soi.is_deleted = 0
      )
    ORDER BY so.created_at DESC;

    SELECT
        soi.sales_order_item_id,
        soi.sales_order_id,
        soi.product_id,
        p.name AS product_name,
        u.short_name AS unit_short_name,
        soi.quantity,
        soi.unit_price,
        p.stock AS available_stock,
        soi.estimation_id,
        e.estimation_number,
        soi.estimation_item_id
    FROM dbo.sales_order_item soi
    INNER JOIN dbo.sales_order so
        ON so.sales_order_id = soi.sales_order_id
       AND so.is_deleted = 0
    INNER JOIN dbo.product p ON p.product_id = soi.product_id
    LEFT JOIN dbo.unit u ON u.unit_id = p.unit_id
    LEFT JOIN dbo.estimation e ON e.estimation_id = soi.estimation_id
    WHERE soi.is_deleted = 0;
END
GO

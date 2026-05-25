-- ============================================================
-- Stored Procedure: usp_SalesInvoice_GetById
-- Returns invoice header and line items.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_GetById]
    @sales_invoice_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        si.sales_invoice_id,
        si.invoice_number,
        si.sales_order_id,
        so.sales_order_number,
        si.customer_id,
        c.name AS customer_name,
        si.tax_percentage,
        si.remarks,
        si.total_amount,
        si.created_at,
        si.modified_at
    FROM dbo.sales_invoice si
    LEFT JOIN dbo.sales_order so ON so.sales_order_id = si.sales_order_id
    LEFT JOIN dbo.customer c ON c.customer_id = si.customer_id
    WHERE si.sales_invoice_id = @sales_invoice_id
      AND si.is_deleted = 0;

    SELECT
        sii.sales_invoice_item_id,
        sii.product_id,
        p.name AS product_name,
        u.short_name AS unit_short_name,
        sii.quantity,
        sii.unit_price,
        sii.sales_order_id,
        so.sales_order_number,
        sii.sales_order_item_id
    FROM dbo.sales_invoice_item sii
    INNER JOIN dbo.product p ON p.product_id = sii.product_id
    LEFT JOIN dbo.unit u ON u.unit_id = p.unit_id
    LEFT JOIN dbo.sales_order so ON so.sales_order_id = sii.sales_order_id
    WHERE sii.sales_invoice_id = @sales_invoice_id
      AND sii.is_deleted = 0;
END
GO

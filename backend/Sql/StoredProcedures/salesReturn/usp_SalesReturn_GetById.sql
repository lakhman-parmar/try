-- ============================================================
-- Stored Procedure: usp_SalesReturn_GetById
-- Returns sales return header and line items.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesReturn_GetById]
    @sales_return_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        sr.sales_return_id,
        sr.return_number,
        sr.sales_invoice_id,
        si.invoice_number,
        sr.customer_id,
        c.name AS customer_name,
        sr.remarks,
        sr.total_amount,
        sr.created_at,
        sr.modified_at
    FROM dbo.sales_return sr
    LEFT JOIN dbo.sales_invoice si ON si.sales_invoice_id = sr.sales_invoice_id
    LEFT JOIN dbo.customer c ON c.customer_id = sr.customer_id
    WHERE sr.sales_return_id = @sales_return_id
      AND sr.is_deleted = 0;

    SELECT
        sri.sales_return_item_id,
        sri.sales_invoice_item_id,
        sri.product_id,
        p.name AS product_name,
        u.short_name AS unit_short_name,
        sri.quantity,
        sri.unit_price,
        sri.sales_invoice_id
    FROM dbo.sales_return_item sri
    INNER JOIN dbo.product p ON p.product_id = sri.product_id
    LEFT JOIN dbo.unit u ON u.unit_id = p.unit_id
    WHERE sri.sales_return_id = @sales_return_id
      AND sri.is_deleted = 0;
END
GO

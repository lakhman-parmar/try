-- ============================================================
-- Stored Procedure: usp_SalesInvoice_Create
-- Creates a sales invoice header + line items.
-- Returns the new sales_invoice_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_Create]
    @sales_order_id INT            = NULL,
    @customer_id    INT            = NULL,
    @tax_percentage DECIMAL(5, 2)   = NULL,
    @total_amount   DECIMAL(10, 2)  = NULL,
    @remarks        NVARCHAR(1000)  = NULL,
    @items          dbo.udt_sales_invoice_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- ── Auto-generate Invoice number  (INV-YYYYMMDD-0001) ──────────
        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'INV-' + @date_part + '-';
        DECLARE @next_seq   INT;
        DECLARE @new_id     INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(invoice_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.sales_invoice
        WHERE invoice_number LIKE @seq_prefix + '%';

        DECLARE @invoice_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);

        -- ── Insert header ─────────────────────────────────────────────
        INSERT INTO dbo.sales_invoice
            (invoice_number, sales_order_id, customer_id, tax_percentage, total_amount, remarks, created_at, is_deleted)
        VALUES
            (@invoice_number, @sales_order_id, @customer_id, @tax_percentage, @total_amount, @remarks, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        -- ── Insert line items ───────────────────────────────────────────
        INSERT INTO dbo.sales_invoice_item
            (sales_invoice_id, product_id, sales_order_id, sales_order_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            i.ProductId,
            i.SalesOrderId,       -- NULL = direct item
            i.SalesOrderItemId,   -- NULL = direct item
            i.Quantity,
            ISNULL(i.UnitPrice, p.selling_price),
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        COMMIT TRANSACTION;

        SELECT @new_id AS new_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO

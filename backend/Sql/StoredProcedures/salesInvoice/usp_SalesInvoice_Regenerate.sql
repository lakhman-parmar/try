-- ============================================================
-- Stored Procedure: usp_SalesInvoice_Regenerate
-- Creates a new sales invoice by cloning an existing invoice.
-- Stock and stock_record are updated for the new invoice.
-- Returns the new sales_invoice_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_Regenerate]
    @source_invoice_id INT,
    @tax_percentage    DECIMAL(5, 2) = NULL,
    @remarks           NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.sales_invoice
            WHERE sales_invoice_id = @source_invoice_id
              AND is_deleted = 0
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50120, 'Source sales invoice not found or has been deleted.', 1;
        END

        IF EXISTS (
            SELECT 1
            FROM dbo.sales_invoice_item sii
            INNER JOIN dbo.product p ON p.product_id = sii.product_id
            WHERE sii.sales_invoice_id = @source_invoice_id
              AND sii.is_deleted = 0
            GROUP BY sii.product_id, p.stock
            HAVING ISNULL(p.stock, 0) < SUM(sii.quantity)
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50121, 'Insufficient stock for one or more invoice items.', 1;
        END

        DECLARE @effective_tax DECIMAL(5, 2);
        DECLARE @effective_remarks NVARCHAR(1000);
        DECLARE @customer_id INT;
        DECLARE @sales_order_id INT;

        SELECT
            @effective_tax = ISNULL(@tax_percentage, tax_percentage),
            @effective_remarks = ISNULL(@remarks, remarks),
            @customer_id = customer_id,
            @sales_order_id = sales_order_id
        FROM dbo.sales_invoice
        WHERE sales_invoice_id = @source_invoice_id;

        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'INV-' + @date_part + '-';
        DECLARE @next_seq   INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(invoice_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.sales_invoice
        WHERE invoice_number LIKE @seq_prefix + '%';

        DECLARE @invoice_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);
        DECLARE @subtotal DECIMAL(18, 4);

        SELECT @subtotal = SUM(quantity * unit_price)
        FROM dbo.sales_invoice_item
        WHERE sales_invoice_id = @source_invoice_id
          AND is_deleted = 0;

        DECLARE @total_amount DECIMAL(18, 4) =
            @subtotal + ISNULL(@subtotal * @effective_tax / 100, 0);

        DECLARE @new_id INT;

        INSERT INTO dbo.sales_invoice
            (invoice_number, sales_order_id, customer_id, tax_percentage, remarks, total_amount, created_at, is_deleted)
        VALUES
            (@invoice_number, @sales_order_id, @customer_id, @effective_tax, @effective_remarks, @total_amount, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        INSERT INTO dbo.sales_invoice_item
            (sales_invoice_id, product_id, sales_order_id, sales_order_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            product_id,
            sales_order_id,
            sales_order_item_id,
            quantity,
            unit_price,
            GETDATE(),
            0
        FROM dbo.sales_invoice_item
        WHERE sales_invoice_id = @source_invoice_id
          AND is_deleted = 0;

        UPDATE p
        SET    p.stock = p.stock - x.Quantity,
               p.modified_at = GETDATE()
        FROM dbo.product p
        INNER JOIN (
            SELECT product_id, SUM(quantity) AS Quantity
            FROM dbo.sales_invoice_item
            WHERE sales_invoice_id = @new_id
              AND is_deleted = 0
            GROUP BY product_id
        ) x ON x.product_id = p.product_id;

        INSERT INTO dbo.stock_record
            (product_id, record_type, transaction_id, quantity_change, price, reason, created_at)
        SELECT
            product_id,
            0,
            @new_id,
            -quantity,
            unit_price,
            'Sales Invoice (Regenerated): ' + @invoice_number,
            GETDATE()
        FROM dbo.sales_invoice_item
        WHERE sales_invoice_id = @new_id
          AND is_deleted = 0;

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

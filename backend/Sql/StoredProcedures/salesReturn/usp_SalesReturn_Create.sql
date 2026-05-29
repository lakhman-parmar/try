-- ============================================================
-- Stored Procedure: usp_SalesReturn_Create
-- Creates a sales return only from sales invoice items, caps
-- quantity by remaining returnable quantity, restores stock,
-- and inserts stock_record entries.
-- Return number is auto-generated: SRT-YYYYMMDD-0001
-- Returns the new sales_return_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesReturn_Create]
    @sales_invoice_id INT            = NULL,
    @customer_id      INT            = NULL,
    @remarks          NVARCHAR(1000) = NULL,
    @items            dbo.udt_sales_return_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM @items)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50300, 'At least one item is required to create a sales return.', 1;
        END

        IF EXISTS (SELECT 1 FROM @items WHERE Quantity <= 0)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50301, 'Return quantity must be greater than zero.', 1;
        END

        IF EXISTS (
            SELECT 1
            FROM @items i
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.sales_invoice_item sii
                INNER JOIN dbo.sales_invoice si
                    ON si.sales_invoice_id = sii.sales_invoice_id
                   AND si.is_deleted = 0
                WHERE sii.sales_invoice_item_id = i.SalesInvoiceItemId
                  AND sii.sales_invoice_id = i.SalesInvoiceId
                  AND sii.product_id = i.ProductId
                  AND sii.is_deleted = 0
            )
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50302, 'One or more return items are not part of a sales invoice.', 1;
        END

        IF (SELECT COUNT(DISTINCT SalesInvoiceId) FROM @items) > 1
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50303, 'A sales return can be created for one sales invoice at a time.', 1;
        END

        DECLARE @resolved_invoice_id INT = @sales_invoice_id;

        IF @resolved_invoice_id IS NULL
            SELECT @resolved_invoice_id = MIN(SalesInvoiceId) FROM @items;

        IF EXISTS (SELECT 1 FROM @items WHERE SalesInvoiceId <> @resolved_invoice_id)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50304, 'Selected return items do not match the sales invoice.', 1;
        END

        DECLARE @resolved_customer_id INT = @customer_id;
        DECLARE @invoice_customer_id INT;

        SELECT @invoice_customer_id = customer_id
        FROM dbo.sales_invoice
        WHERE sales_invoice_id = @resolved_invoice_id
          AND is_deleted = 0;

        IF @resolved_customer_id IS NULL
            SET @resolved_customer_id = @invoice_customer_id;

        IF @invoice_customer_id IS NOT NULL
           AND @resolved_customer_id IS NOT NULL
           AND @invoice_customer_id <> @resolved_customer_id
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50305, 'Selected sales invoice does not match the return customer.', 1;
        END

        IF EXISTS (
            SELECT 1
            FROM (
                SELECT
                    i.SalesInvoiceItemId,
                    SUM(i.Quantity) AS RequestedQuantity
                FROM @items i
                GROUP BY i.SalesInvoiceItemId
            ) req
            INNER JOIN dbo.sales_invoice_item sii
                ON sii.sales_invoice_item_id = req.SalesInvoiceItemId
            OUTER APPLY (
                SELECT SUM(sri.quantity) AS ReturnedQuantity
                FROM dbo.sales_return_item sri
                INNER JOIN dbo.sales_return sr
                    ON sr.sales_return_id = sri.sales_return_id
                   AND sr.is_deleted = 0
                WHERE sri.sales_invoice_item_id = req.SalesInvoiceItemId
                  AND sri.is_deleted = 0
            ) ret
            WHERE req.RequestedQuantity > sii.quantity - ISNULL(ret.ReturnedQuantity, 0)
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50306, 'Return quantity exceeds the remaining invoice quantity.', 1;
        END

        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'SRT-' + @date_part + '-';
        DECLARE @next_seq   INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(return_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.sales_return
        WHERE return_number LIKE @seq_prefix + '%';

        DECLARE @return_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);
        DECLARE @subtotal DECIMAL(18, 4);

        SELECT @subtotal = SUM(i.Quantity * ISNULL(i.UnitPrice, sii.unit_price))
        FROM @items i
        INNER JOIN dbo.sales_invoice_item sii
            ON sii.sales_invoice_item_id = i.SalesInvoiceItemId;

        DECLARE @total_amount DECIMAL(18, 4) = @subtotal;

        DECLARE @new_id INT;

        INSERT INTO dbo.sales_return
            (return_number, sales_invoice_id, customer_id, remarks, total_amount, created_at, is_deleted)
        VALUES
            (@return_number, @resolved_invoice_id, @resolved_customer_id, @remarks, @total_amount, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        INSERT INTO dbo.sales_return_item
            (sales_return_id, sales_invoice_id, sales_invoice_item_id, product_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            i.SalesInvoiceId,
            i.SalesInvoiceItemId,
            i.ProductId,
            i.Quantity,
            ISNULL(i.UnitPrice, sii.unit_price),
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.sales_invoice_item sii
            ON sii.sales_invoice_item_id = i.SalesInvoiceItemId;

        UPDATE p
        SET    p.stock = ISNULL(p.stock, 0) + x.Quantity,
               p.modified_at = GETDATE()
        FROM dbo.product p
        INNER JOIN (
            SELECT ProductId, SUM(Quantity) AS Quantity
            FROM @items
            GROUP BY ProductId
        ) x ON x.ProductId = p.product_id;

        INSERT INTO dbo.stock_record
            (product_id, record_type, transaction_id, quantity_change, price, reason, created_at)
        SELECT
            i.ProductId,
            0,
            @new_id,
            i.Quantity,
            ISNULL(i.UnitPrice, sii.unit_price),
            'Sales Return: ' + @return_number,
            GETDATE()
        FROM @items i
        INNER JOIN dbo.sales_invoice_item sii
            ON sii.sales_invoice_item_id = i.SalesInvoiceItemId;

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

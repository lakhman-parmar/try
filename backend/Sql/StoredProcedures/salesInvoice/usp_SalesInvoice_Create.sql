-- ============================================================
-- Stored Procedure: usp_SalesInvoice_Create
-- Creates a sales invoice header + line items, then decreases
-- product stock and inserts stock_record entries.
-- Customer is auto-resolved from selected sales orders when possible.
-- Invoice number is auto-generated: INV-YYYYMMDD-0001
-- Returns the new sales_invoice_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_Create]
    @customer_id    INT           = NULL,
    @tax_percentage DECIMAL(5, 2) = NULL,
    @remarks        NVARCHAR(1000) = NULL,
    @items          dbo.udt_sales_invoice_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM @items)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50100, 'At least one item is required to create a sales invoice.', 1;
        END

        IF EXISTS (
            SELECT 1
            FROM @items i
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.product p
                WHERE p.product_id = i.ProductId
                  AND p.is_deleted = 0
            )
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50101, 'One or more products are invalid or deleted.', 1;
        END

        IF EXISTS (
            SELECT 1
            FROM @items i
            WHERE i.SalesOrderItemId IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM dbo.sales_order_item soi
                  INNER JOIN dbo.sales_order so
                      ON so.sales_order_id = soi.sales_order_id
                     AND so.is_deleted = 0
                  WHERE soi.sales_order_item_id = i.SalesOrderItemId
                    AND soi.sales_order_id = i.SalesOrderId
                    AND soi.product_id = i.ProductId
                    AND soi.is_deleted = 0
              )
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50102, 'One or more sales order item references are invalid.', 1;
        END

        DECLARE @resolved_customer_id INT = @customer_id;

        IF @resolved_customer_id IS NULL
        BEGIN
            SELECT @resolved_customer_id = MIN(so.customer_id)
            FROM @items i
            INNER JOIN dbo.sales_order so
                ON so.sales_order_id = i.SalesOrderId
               AND so.is_deleted = 0;
        END

        IF (
            SELECT COUNT(DISTINCT so.customer_id)
            FROM @items i
            INNER JOIN dbo.sales_order so
                ON so.sales_order_id = i.SalesOrderId
               AND so.is_deleted = 0
            WHERE so.customer_id IS NOT NULL
        ) > 1
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50103, 'Items in a sales invoice must belong to the same customer.', 1;
        END

        IF @resolved_customer_id IS NOT NULL
           AND EXISTS (
               SELECT 1
               FROM @items i
               INNER JOIN dbo.sales_order so
                   ON so.sales_order_id = i.SalesOrderId
                  AND so.is_deleted = 0
               WHERE so.customer_id IS NOT NULL
                 AND so.customer_id <> @resolved_customer_id
           )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50104, 'Selected sales order items do not match the invoice customer.', 1;
        END

        IF EXISTS (
            SELECT 1
            FROM @items i
            INNER JOIN dbo.product p ON p.product_id = i.ProductId
            GROUP BY i.ProductId, p.stock
            HAVING ISNULL(p.stock, 0) < SUM(i.Quantity)
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50105, 'Insufficient stock for one or more invoice items.', 1;
        END

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

        SELECT @subtotal = SUM(i.Quantity * ISNULL(i.UnitPrice, p.selling_price))
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        DECLARE @total_amount DECIMAL(18, 4) =
            @subtotal + ISNULL(@subtotal * @tax_percentage / 100, 0);

        DECLARE @header_sales_order_id INT = NULL;

        IF (SELECT COUNT(DISTINCT SalesOrderId) FROM @items WHERE SalesOrderId IS NOT NULL) = 1
        BEGIN
            SELECT @header_sales_order_id = MIN(SalesOrderId)
            FROM @items
            WHERE SalesOrderId IS NOT NULL;
        END

        DECLARE @new_id INT;

        INSERT INTO dbo.sales_invoice
            (invoice_number, sales_order_id, customer_id, tax_percentage, remarks, total_amount, created_at, is_deleted)
        VALUES
            (@invoice_number, @header_sales_order_id, @resolved_customer_id, @tax_percentage, @remarks, @total_amount, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        INSERT INTO dbo.sales_invoice_item
            (sales_invoice_id, product_id, sales_order_id, sales_order_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            i.ProductId,
            i.SalesOrderId,
            i.SalesOrderItemId,
            i.Quantity,
            ISNULL(i.UnitPrice, p.selling_price),
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        UPDATE p
        SET    p.stock = p.stock - x.Quantity,
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
            -i.Quantity,
            ISNULL(i.UnitPrice, p.selling_price),
            'Sales Invoice: ' + @invoice_number,
            GETDATE()
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

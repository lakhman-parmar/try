-- ============================================================
-- Stored Procedure: usp_SalesInvoice_Update
-- Full replace of line items. Restores old stock and applies new stock.
-- Returns rows_affected (0 = not found / already deleted).
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_Update]
    @sales_invoice_id INT,
    @customer_id      INT           = NULL,
    @tax_percentage   DECIMAL(5, 2) = NULL,
    @remarks          NVARCHAR(1000) = NULL,
    @items            dbo.udt_sales_invoice_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM dbo.sales_invoice
            WHERE sales_invoice_id = @sales_invoice_id
              AND is_deleted = 0
        )
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS rows_affected;
            RETURN;
        END

        UPDATE p
        SET p.stock = p.stock + x.Quantity,
            p.modified_at = GETDATE()
        FROM dbo.product p
        INNER JOIN (
            SELECT product_id, SUM(quantity) AS Quantity
            FROM dbo.sales_invoice_item
            WHERE sales_invoice_id = @sales_invoice_id
              AND is_deleted = 0
            GROUP BY product_id
        ) x ON x.product_id = p.product_id;

        IF EXISTS (
            SELECT 1
            FROM @items i
            INNER JOIN dbo.product p ON p.product_id = i.ProductId
            GROUP BY i.ProductId, p.stock
            HAVING ISNULL(p.stock, 0) < SUM(i.Quantity)
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50130, 'Insufficient stock for one or more invoice items.', 1;
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

        DECLARE @header_sales_order_id INT = NULL;

        IF (SELECT COUNT(DISTINCT SalesOrderId) FROM @items WHERE SalesOrderId IS NOT NULL) = 1
        BEGIN
            SELECT @header_sales_order_id = MIN(SalesOrderId)
            FROM @items
            WHERE SalesOrderId IS NOT NULL;
        END

        DECLARE @subtotal DECIMAL(18, 4);

        SELECT @subtotal = SUM(i.Quantity * ISNULL(i.UnitPrice, p.selling_price))
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        DECLARE @total_amount DECIMAL(18, 4) =
            @subtotal + ISNULL(@subtotal * @tax_percentage / 100, 0);

        UPDATE dbo.sales_invoice
        SET    sales_order_id = @header_sales_order_id,
               customer_id = @resolved_customer_id,
               tax_percentage = @tax_percentage,
               remarks = @remarks,
               total_amount = @total_amount,
               modified_at = GETDATE()
        WHERE  sales_invoice_id = @sales_invoice_id
          AND  is_deleted = 0;

        UPDATE dbo.sales_invoice_item
        SET    is_deleted = 1,
               modified_at = GETDATE()
        WHERE  sales_invoice_id = @sales_invoice_id
          AND  is_deleted = 0;

        INSERT INTO dbo.sales_invoice_item
            (sales_invoice_id, product_id, sales_order_id, sales_order_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @sales_invoice_id,
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
        SET p.stock = p.stock - x.Quantity,
            p.modified_at = GETDATE()
        FROM dbo.product p
        INNER JOIN (
            SELECT ProductId, SUM(Quantity) AS Quantity
            FROM @items
            GROUP BY ProductId
        ) x ON x.ProductId = p.product_id;

        COMMIT TRANSACTION;

        SELECT 1 AS rows_affected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO

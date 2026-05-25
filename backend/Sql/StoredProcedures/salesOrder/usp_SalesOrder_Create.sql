-- ============================================================
-- Stored Procedure: usp_SalesOrder_Create
-- Creates a sales order header + line items.
-- Returns the new sales_order_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesOrder_Create]
    @customer_id    INT            = NULL,
    @tax_percentage DECIMAL(5, 2)   = NULL,
    @remarks        NVARCHAR(1000)  = NULL,
    @items          dbo.udt_sales_order_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- ── Auto-generate SO number  (SO-YYYYMMDD-0001) ────────────────
        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'SO-' + @date_part + '-';
        DECLARE @next_seq   INT;
        DECLARE @new_id     INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(sales_order_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.sales_order
        WHERE sales_order_number LIKE @seq_prefix + '%';

        DECLARE @sales_order_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);

        -- ── Insert header ─────────────────────────────────────────────
        INSERT INTO dbo.sales_order
            (sales_order_number, customer_id, tax_percentage, remarks, created_at, is_deleted)
        VALUES
            (@sales_order_number, @customer_id, @tax_percentage, @remarks, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        -- ── Insert line items ───────────────────────────────────────────
        INSERT INTO dbo.sales_order_item
            (sales_order_id, product_id, estimation_id, estimation_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            i.ProductId,
            i.EstimationId,       -- NULL = direct item
            i.EstimationItemId,   -- NULL = direct item
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

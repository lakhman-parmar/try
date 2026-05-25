-- ============================================================
-- Stored Procedure: usp_SalesOrder_Update
-- Full replace of line items (soft-delete old, insert new).
-- Preserves estimation traceability on re-submitted items.
-- Returns rows_affected (0 = not found / already deleted).
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesOrder_Update]
    @sales_order_id INT,
    @customer_id    INT            = NULL,
    @tax_percentage DECIMAL(5, 2)   = NULL,
    @remarks        NVARCHAR(1000)  = NULL,
    @items          dbo.udt_sales_order_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- ── Update header ───────────────────────────────────────────────
        UPDATE dbo.sales_order
        SET    customer_id    = @customer_id,
               tax_percentage = @tax_percentage,
               remarks        = @remarks,
               modified_at    = GETDATE()
        WHERE  sales_order_id = @sales_order_id
          AND  is_deleted = 0;

        DECLARE @rows_affected INT = @@ROWCOUNT;

        IF @rows_affected = 0
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS rows_affected;
            RETURN;
        END;

        -- ── Soft-delete existing line items ─────────────────────────────
        UPDATE dbo.sales_order_item
        SET    is_deleted  = 1,
               modified_at = GETDATE()
        WHERE  sales_order_id = @sales_order_id
          AND  is_deleted = 0;

        -- ── Insert updated line items ───────────────────────────────────
        INSERT INTO dbo.sales_order_item
            (sales_order_id, product_id, estimation_id, estimation_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @sales_order_id,
            i.ProductId,
            i.EstimationId,
            i.EstimationItemId,
            i.Quantity,
            ISNULL(i.UnitPrice, p.selling_price),
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        COMMIT TRANSACTION;

        SELECT @rows_affected AS rows_affected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO

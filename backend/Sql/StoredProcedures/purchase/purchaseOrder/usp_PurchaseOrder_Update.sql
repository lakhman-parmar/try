-- ============================================================
-- Stored Procedure: usp_PurchaseOrder_Update
-- Full replace of line items (soft-delete old, insert new).
-- supplier_id is AUTO-RESOLVED from supplier_product mapping
-- based on the submitted items. All items must belong to the
-- same supplier — a mismatch raises an error.
-- Preserves requisition traceability on re-submitted items.
-- Returns rows_affected (0 = not found / already deleted).
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_Update]
    @purchase_order_id INT,
    @tax_percentage    DECIMAL(5, 2)  = NULL,
    @remarks           NVARCHAR(1000) = NULL,
    @items             dbo.udt_purchase_order_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Resolve supplier from items
        DECLARE @resolved_supplier_id INT;

        -- Validate: every product must have a supplier
        IF EXISTS (
            SELECT 1
            FROM @items i
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.supplier_product sp
                WHERE sp.product_id = i.ProductId
                  AND sp.is_deleted = 0
            )
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50001, 'One or more items do not have an associated supplier. Please configure supplier-product mappings first.', 1;
        END

        -- Validate: all products must belong to the same single supplier
        IF (
            SELECT COUNT(DISTINCT sp.supplier_id)
            FROM @items i
            INNER JOIN dbo.supplier_product sp
                ON sp.product_id = i.ProductId
               AND sp.is_deleted = 0
        ) > 1
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50002, 'Items in a purchase order must all belong to the same supplier. The selected items are linked to multiple suppliers.', 1;
        END

        SELECT @resolved_supplier_id = MIN(sp.supplier_id)
        FROM @items i
        INNER JOIN dbo.supplier_product sp
            ON sp.product_id = i.ProductId
           AND sp.is_deleted = 0;

        -- Update header
        UPDATE dbo.purchase_order
        SET    supplier_id    = @resolved_supplier_id,
               tax_percentage = @tax_percentage,
               remarks        = @remarks,
               modified_at    = GETDATE()
        WHERE  purchase_order_id = @purchase_order_id
          AND  is_deleted = 0;

        DECLARE @rows_affected INT = @@ROWCOUNT;

        IF @rows_affected = 0
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS rows_affected;
            RETURN;
        END;

        -- Soft-delete existing line items
        UPDATE dbo.purchase_order_item
        SET    is_deleted  = 1,
               modified_at = GETDATE()
        WHERE  purchase_order_id = @purchase_order_id
          AND  is_deleted = 0;

        -- Insert updated line items
        INSERT INTO dbo.purchase_order_item
            (purchase_order_id, product_id, requisition_id, requisition_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @purchase_order_id,
            i.ProductId,
            i.RequisitionId,
            i.RequisitionItemId,
            i.Quantity,
            ISNULL(i.UnitPrice, p.purchase_price),
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

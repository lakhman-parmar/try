-- ============================================================
-- Stored Procedure: usp_PurchaseOrder_Create
-- Creates a purchase order header + line items.
-- supplier_id is AUTO-RESOLVED from supplier_product mapping
-- based on the submitted items. All items must belong to the
-- same supplier — a mismatch raises an error.
-- Returns the new purchase_order_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_Create]
    @tax_percentage DECIMAL(5, 2)  = NULL,
    @remarks        NVARCHAR(1000) = NULL,
    @items          dbo.udt_purchase_order_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Resolve supplier from items
        -- Each product must have exactly one active supplier via supplier_product.
        -- All products in this PO must resolve to the same supplier.

        DECLARE @resolved_supplier_id INT;

        -- Check that all items resolve to a single unique supplier
        SELECT @resolved_supplier_id = MIN(sp.supplier_id)
        FROM @items i
        INNER JOIN dbo.supplier_product sp
            ON sp.product_id = i.ProductId
           AND sp.is_deleted = 0;

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

        -- Auto-generate PO number  (PO-YYYYMMDD-0001)
        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'PO-' + @date_part + '-';
        DECLARE @next_seq   INT;
        DECLARE @new_id     INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(po_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.purchase_order
        WHERE po_number LIKE @seq_prefix + '%';

        DECLARE @po_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);

        -- Insert header (supplier resolved automatically)
        INSERT INTO dbo.purchase_order
            (po_number, supplier_id, tax_percentage, remarks, created_at, is_deleted)
        VALUES
            (@po_number, @resolved_supplier_id, @tax_percentage, @remarks, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        -- Insert line items
        INSERT INTO dbo.purchase_order_item
            (purchase_order_id, product_id, requisition_id, requisition_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
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

        SELECT @new_id AS new_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO

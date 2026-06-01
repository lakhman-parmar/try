-- ============================================================
-- Stored Procedure: usp_PurchaseBill_Create
-- Creates a purchase bill header + line items, then updates
-- product stock and inserts stock_record entries.
-- supplier_id is AUTO-RESOLVED from the items (same logic as PO).
-- Bill number is auto-generated: BILL-YYYYMMDD-0001
-- Returns the new purchase_bill_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseBill_Create]
    @tax_percentage DECIMAL(5, 2)  = NULL,
    @remarks        NVARCHAR(1000) = NULL,
    @items          dbo.udt_purchase_bill_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Resolve supplier from items 
        -- UnitPrice in the TVP can be NULL; we fall back to product.purchase_price.
        -- Supplier is resolved via supplier_product mapping.

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

        IF (
            SELECT COUNT(DISTINCT sp.supplier_id)
            FROM @items i
            INNER JOIN dbo.supplier_product sp
                ON sp.product_id = i.ProductId
               AND sp.is_deleted = 0
        ) > 1
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50002, 'Items in a purchase bill must all belong to the same supplier. The selected items are linked to multiple suppliers.', 1;
        END

        DECLARE @resolved_supplier_id INT;
        SELECT @resolved_supplier_id = MIN(sp.supplier_id)
        FROM @items i
        INNER JOIN dbo.supplier_product sp
            ON sp.product_id = i.ProductId
           AND sp.is_deleted = 0;

        -- Auto-generate bill number (BILL-YYYYMMDD-0001)
        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'BILL-' + @date_part + '-';
        DECLARE @next_seq   INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(bill_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.purchase_bill
        WHERE bill_number LIKE @seq_prefix + '%';

        DECLARE @bill_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);

        -- Compute total amount (subtotal + tax)
        DECLARE @subtotal DECIMAL(18, 4);

        SELECT @subtotal = SUM(i.Quantity * ISNULL(i.UnitPrice, p.purchase_price))
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        DECLARE @total_amount DECIMAL(18, 4) =
            @subtotal + ISNULL(@subtotal * @tax_percentage / 100, 0);

        -- Insert bill header
        DECLARE @new_id INT;

        INSERT INTO dbo.purchase_bill
            (bill_number, supplier_id, tax_percentage, remarks, total_amount, created_at, is_deleted)
        VALUES
            (@bill_number, @resolved_supplier_id, @tax_percentage, @remarks, @total_amount, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        -- Insert bill line items
        INSERT INTO dbo.purchase_bill_item
            (purchase_bill_id, product_id, purchase_order_id, purchase_order_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            i.ProductId,
            i.PurchaseOrderId,
            i.PurchaseOrderItemId,
            i.Quantity,
            ISNULL(i.UnitPrice, p.purchase_price),
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        -- Update product stock (increase on purchase)
        UPDATE p
        SET    p.stock      = p.stock + i.Quantity,
               p.modified_at = GETDATE()
        FROM   dbo.product p
        INNER JOIN @items i ON i.ProductId = p.product_id;

        -- Insert stock_record entries
        -- RecordType: 1 = Purchase (matches domain enum)
        INSERT INTO dbo.stock_record
            (product_id, record_type, transaction_id, quantity_change, price, reason, created_at)
        SELECT
            i.ProductId,
            1,                                          -- RecordType.Purchase
            @new_id,                                    -- transaction_id = purchase_bill_id
            i.Quantity,
            ISNULL(i.UnitPrice, p.purchase_price),
            'Purchase Bill: ' + @bill_number,
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

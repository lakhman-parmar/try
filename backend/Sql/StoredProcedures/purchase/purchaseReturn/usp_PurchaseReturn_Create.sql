-- ============================================================
-- Stored Procedure: usp_PurchaseReturn_Create
-- Creates a purchase return header + line items.
-- Business rules enforced:
--   1. Every item must reference a valid, non-deleted purchase_bill_item.
--   2. The return quantity per item cannot exceed:
--        (original billed quantity) - (already returned quantity for that bill item).
--   3. All items must belong to the same supplier (resolved from the bill).
-- On success:
--   - Inserts purchase_return + purchase_return_item rows.
--   - DECREMENTS product.stock (goods going back to supplier).
--   - Inserts stock_record rows with a negative quantity_change.
-- Return number auto-generated: PRET-YYYYMMDD-0001
-- Returns the new purchase_return_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseReturn_Create]
    @remarks        NVARCHAR(1000) = NULL,
    @items          dbo.udt_purchase_return_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- ── Validate all referenced bill items exist and are not deleted ──────
        IF EXISTS (
            SELECT 1
            FROM @items i
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.purchase_bill_item pbi
                WHERE pbi.purchase_bill_item_id = i.PurchaseBillItemId
                  AND pbi.purchase_bill_id      = i.PurchaseBillId
                  AND pbi.product_id            = i.ProductId
                  AND pbi.is_deleted            = 0
            )
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50001, 'One or more items reference an invalid or deleted purchase bill item.', 1;
        END

        -- ── Validate return quantity does not exceed remaining returnable qty ──
        -- Remaining = billed_quantity - SUM(already returned for that bill item)
        IF EXISTS (
            SELECT 1
            FROM @items i
            INNER JOIN dbo.purchase_bill_item pbi
                ON pbi.purchase_bill_item_id = i.PurchaseBillItemId
            WHERE i.Quantity > (
                pbi.quantity - ISNULL((
                    SELECT SUM(pri.quantity)
                    FROM dbo.purchase_return_item pri
                    INNER JOIN dbo.purchase_return pr
                        ON pr.purchase_return_id = pri.purchase_return_id
                       AND pr.is_deleted         = 0
                    WHERE pri.purchase_bill_item_id = i.PurchaseBillItemId
                      AND pri.is_deleted            = 0
                ), 0)
            )
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50002, 'Return quantity exceeds the remaining returnable quantity for one or more items.', 1;
        END

        -- ── Resolve supplier from the referenced bill ─────────────────────────
        -- All items must trace back to the same supplier.
        IF (
            SELECT COUNT(DISTINCT pb.supplier_id)
            FROM @items i
            INNER JOIN dbo.purchase_bill pb
                ON pb.purchase_bill_id = i.PurchaseBillId
               AND pb.is_deleted       = 0
        ) > 1
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50003, 'All return items must belong to the same supplier.', 1;
        END

        DECLARE @resolved_supplier_id INT;
        SELECT @resolved_supplier_id = MIN(pb.supplier_id)
        FROM @items i
        INNER JOIN dbo.purchase_bill pb
            ON pb.purchase_bill_id = i.PurchaseBillId
           AND pb.is_deleted       = 0;

        -- ── Auto-generate return number (PRET-YYYYMMDD-0001) ─────────────────
        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'PRET-' + @date_part + '-';
        DECLARE @next_seq   INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(purchase_return_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.purchase_return
        WHERE purchase_return_number LIKE @seq_prefix + '%';

        DECLARE @return_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);

        -- ── Compute total amount ──────────────────────────────────────────────
        DECLARE @subtotal DECIMAL(18, 4);

        SELECT @subtotal = SUM(i.Quantity * ISNULL(i.UnitPrice, pbi.unit_price))
        FROM @items i
        INNER JOIN dbo.purchase_bill_item pbi
            ON pbi.purchase_bill_item_id = i.PurchaseBillItemId;

        DECLARE @total_amount DECIMAL(18, 4) = @subtotal;

        -- ── Insert return header ──────────────────────────────────────────────
        DECLARE @new_id INT;

        INSERT INTO dbo.purchase_return
            (purchase_return_number, supplier_id, total_amount, remarks, created_at, is_deleted)
        VALUES
            (@return_number, @resolved_supplier_id, @total_amount, @remarks, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        -- ── Insert return line items ──────────────────────────────────────────
        INSERT INTO dbo.purchase_return_item
            (purchase_return_id, product_id, purchase_bill_id, purchase_bill_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            i.ProductId,
            i.PurchaseBillId,
            i.PurchaseBillItemId,
            i.Quantity,
            ISNULL(i.UnitPrice, pbi.unit_price),
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.purchase_bill_item pbi
            ON pbi.purchase_bill_item_id = i.PurchaseBillItemId;

        -- ── Decrement product stock (goods returned to supplier) ──────────────
        UPDATE p
        SET    p.stock       = p.stock - i.Quantity,
               p.modified_at = GETDATE()
        FROM   dbo.product p
        INNER JOIN @items i ON i.ProductId = p.product_id;

        -- ── Insert stock_record entries (negative quantity_change) ────────────
        -- RecordType: 1 = Purchase (purchase-side transaction)
        INSERT INTO dbo.stock_record
            (product_id, record_type, transaction_id, quantity_change, price, reason, created_at)
        SELECT
            i.ProductId,
            1,                                              -- RecordType.Purchase
            @new_id,                                        -- transaction_id = purchase_return_id
            -(i.Quantity),                                  -- negative = stock leaving warehouse
            ISNULL(i.UnitPrice, pbi.unit_price),
            'Purchase Return: ' + @return_number,
            GETDATE()
        FROM @items i
        INNER JOIN dbo.purchase_bill_item pbi
            ON pbi.purchase_bill_item_id = i.PurchaseBillItemId;

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

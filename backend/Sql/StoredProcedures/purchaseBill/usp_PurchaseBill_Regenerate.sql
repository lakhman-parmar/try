-- ============================================================
-- Stored Procedure: usp_PurchaseBill_Regenerate
-- Creates a NEW purchase bill by cloning items from an existing
-- bill (identified by @source_bill_id). The source bill is NOT
-- modified — it is read-only for history purposes.
-- Stock and stock_record are updated for the new bill exactly
-- as in usp_PurchaseBill_Create.
-- Returns the new purchase_bill_id.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseBill_Regenerate]
    @source_bill_id INT,
    @tax_percentage DECIMAL(5, 2)  = NULL,  -- NULL = inherit from source bill
    @remarks        NVARCHAR(1000) = NULL    -- NULL = inherit from source bill
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- ── Validate source bill exists ─────────────────────────────────
        IF NOT EXISTS (
            SELECT 1 FROM dbo.purchase_bill
            WHERE purchase_bill_id = @source_bill_id AND is_deleted = 0
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50010, 'Source purchase bill not found or has been deleted.', 1;
        END

        -- ── Inherit tax_percentage and remarks from source if not overridden
        DECLARE @effective_tax     DECIMAL(5, 2);
        DECLARE @effective_remarks NVARCHAR(1000);
        DECLARE @supplier_id       INT;

        SELECT
            @effective_tax     = ISNULL(@tax_percentage, tax_percentage),
            @effective_remarks = ISNULL(@remarks, remarks),
            @supplier_id       = supplier_id
        FROM   dbo.purchase_bill
        WHERE  purchase_bill_id = @source_bill_id;

        -- ── Auto-generate new bill number ────────────────────────────────
        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'BILL-' + @date_part + '-';
        DECLARE @next_seq   INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(bill_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.purchase_bill
        WHERE bill_number LIKE @seq_prefix + '%';

        DECLARE @bill_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);

        -- ── Compute total from source items ──────────────────────────────
        DECLARE @subtotal DECIMAL(18, 4);
        SELECT @subtotal = SUM(quantity * unit_price)
        FROM   dbo.purchase_bill_item
        WHERE  purchase_bill_id = @source_bill_id AND is_deleted = 0;

        DECLARE @total_amount DECIMAL(18, 4) =
            @subtotal + ISNULL(@subtotal * @effective_tax / 100, 0);

        -- ── Insert new bill header ───────────────────────────────────────
        DECLARE @new_id INT;

        INSERT INTO dbo.purchase_bill
            (bill_number, supplier_id, tax_percentage, remarks, total_amount, created_at, is_deleted)
        VALUES
            (@bill_number, @supplier_id, @effective_tax, @effective_remarks, @total_amount, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        -- ── Clone items from source bill ─────────────────────────────────
        INSERT INTO dbo.purchase_bill_item
            (purchase_bill_id, product_id, purchase_order_id, purchase_order_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            product_id,
            purchase_order_id,
            purchase_order_item_id,
            quantity,
            unit_price,
            GETDATE(),
            0
        FROM dbo.purchase_bill_item
        WHERE purchase_bill_id = @source_bill_id AND is_deleted = 0;

        -- ── Update product stock ─────────────────────────────────────────
        UPDATE p
        SET    p.stock       = p.stock + pbi.quantity,
               p.modified_at = GETDATE()
        FROM   dbo.product p
        INNER JOIN dbo.purchase_bill_item pbi
               ON pbi.product_id = p.product_id
        WHERE  pbi.purchase_bill_id = @new_id
          AND  pbi.is_deleted = 0;

        -- ── Insert stock_record entries ──────────────────────────────────
        INSERT INTO dbo.stock_record
            (product_id, record_type, transaction_id, quantity_change, price, reason, created_at)
        SELECT
            pbi.product_id,
            1,          -- RecordType.Purchase
            @new_id,
            pbi.quantity,
            pbi.unit_price,
            'Purchase Bill (Regenerated): ' + @bill_number,
            GETDATE()
        FROM dbo.purchase_bill_item pbi
        WHERE pbi.purchase_bill_id = @new_id AND pbi.is_deleted = 0;

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
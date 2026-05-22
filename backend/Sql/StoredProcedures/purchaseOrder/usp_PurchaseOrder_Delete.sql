-- ============================================================
-- Stored Procedure: usp_PurchaseOrder_Delete
-- Soft-deletes a purchase order and all its line items.
-- Returns rows_affected (0 = not found).
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_Delete]
    @purchase_order_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Soft-delete line items first
        UPDATE dbo.purchase_order_item
        SET    is_deleted  = 1,
               modified_at = GETDATE()
        WHERE  purchase_order_id = @purchase_order_id
          AND  is_deleted = 0;

        -- Soft-delete header
        UPDATE dbo.purchase_order
        SET    is_deleted  = 1,
               modified_at = GETDATE()
        WHERE  purchase_order_id = @purchase_order_id
          AND  is_deleted = 0;

        SELECT @@ROWCOUNT AS rows_affected;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO

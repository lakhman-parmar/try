-- ============================================================
-- Stored Procedure: usp_SalesInvoice_Delete
-- Soft-deletes a sales invoice and all its line items.
-- Returns rows_affected (0 = not found).
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_Delete]
    @sales_invoice_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Soft-delete line items first
        UPDATE dbo.sales_invoice_item
        SET    is_deleted  = 1,
               modified_at = GETDATE()
        WHERE  sales_invoice_id = @sales_invoice_id
          AND  is_deleted = 0;

        -- Soft-delete header
        UPDATE dbo.sales_invoice
        SET    is_deleted  = 1,
               modified_at = GETDATE()
        WHERE  sales_invoice_id = @sales_invoice_id
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

USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Estimation_Update]
    @estimation_id INT,
    @customer_id   INT = NULL,
    @remarks       NVARCHAR(1000) = NULL,
    @items         dbo.udt_estimation_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        UPDATE dbo.estimation
        SET customer_id = @customer_id,
            remarks = @remarks,
            modified_at = GETDATE()
        WHERE estimation_id = @estimation_id
          AND is_deleted = 0;

        DECLARE @rows_affected INT = @@ROWCOUNT;

        IF @rows_affected = 0
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS rows_affected;
            RETURN;
        END;

        UPDATE dbo.estimation_item
        SET is_deleted = 1,
            modified_at = GETDATE()
        WHERE estimation_id = @estimation_id
          AND is_deleted = 0;

        INSERT INTO dbo.estimation_item (estimation_id, product_id, quantity, created_at, is_deleted)
        SELECT @estimation_id, i.product_id, i.quantity, GETDATE(), 0
        FROM @items i;

        COMMIT TRANSACTION;

        SELECT @rows_affected AS rows_affected;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

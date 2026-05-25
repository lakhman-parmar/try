USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Estimation_Delete]
    @estimation_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        UPDATE dbo.estimation_item
        SET is_deleted = 1,
            modified_at = GETDATE()
        WHERE estimation_id = @estimation_id
          AND is_deleted = 0;

        UPDATE dbo.estimation
        SET is_deleted = 1,
            modified_at = GETDATE()
        WHERE estimation_id = @estimation_id
          AND is_deleted = 0;

        SELECT @@ROWCOUNT AS rows_affected;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

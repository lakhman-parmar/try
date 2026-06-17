USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Estimation_Create]
    @customer_id INT = NULL,
    @remarks     NVARCHAR(1000) = NULL,
    @items       dbo.udt_estimation_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @date_part NVARCHAR(8) = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'EST-' + @date_part + '-';
        DECLARE @next_seq INT;
        DECLARE @new_id INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(estimation_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.estimation
        WHERE estimation_number LIKE @seq_prefix + '%';

        DECLARE @estimation_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);

        INSERT INTO dbo.estimation (estimation_number, customer_id, remarks, created_at, is_deleted)
        VALUES (@estimation_number, @customer_id, @remarks, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        INSERT INTO dbo.estimation_item (estimation_id, product_id, quantity, unit_price, created_at, is_deleted)
        SELECT @new_id, i.product_id, SUM(i.quantity), MAX(i.unit_price), GETDATE(), 0
        FROM @items i
        GROUP BY i.product_id;

        COMMIT TRANSACTION;

        SELECT @new_id AS new_id;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

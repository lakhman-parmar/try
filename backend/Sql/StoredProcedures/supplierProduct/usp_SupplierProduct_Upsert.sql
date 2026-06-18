USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SupplierProduct_Upsert]
    @product_id INT,
    @supplier_id INT,
    @purchase_price DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;

    IF @purchase_price < 0
    BEGIN
        THROW 50002, 'Purchase price cannot be negative.', 1;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @supplier_product_id INT;

        -- Check if it exists (even if is_deleted = 1)
        SELECT @supplier_product_id = supplier_product_id
        FROM dbo.supplier_product
        WHERE product_id = @product_id AND supplier_id = @supplier_id;

        IF @supplier_product_id IS NOT NULL
        BEGIN
            -- Update existing mapping (reactivate if soft deleted)
            UPDATE dbo.supplier_product
            SET purchase_price = @purchase_price,
                is_deleted = 0,
                modified_at = GETDATE()
            WHERE supplier_product_id = @supplier_product_id;
        END
        ELSE
        BEGIN
            -- Insert new mapping
            INSERT INTO dbo.supplier_product (product_id, supplier_id, purchase_price, created_at, is_deleted)
            VALUES (@product_id, @supplier_id, @purchase_price, GETDATE(), 0);

            SET @supplier_product_id = SCOPE_IDENTITY();
        END

        COMMIT TRANSACTION;
        SELECT @supplier_product_id AS supplier_product_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO

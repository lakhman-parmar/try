CREATE OR ALTER PROCEDURE [dbo].[usp_Product_Create]
    @name          NVARCHAR(500),
    @description   VARCHAR(1000) = NULL,
    @selling_price DECIMAL(10,2) = NULL,
    @unit_id       INT           = NULL,
    @image_url     VARCHAR(500)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[product]
        (name, description, selling_price, stock, unit_id, image_url, created_at, is_deleted)
    VALUES
        (@name, @description, @selling_price, 0, @unit_id, @image_url, GETDATE(), 0);

    SELECT SCOPE_IDENTITY() AS new_id;
END;
GO

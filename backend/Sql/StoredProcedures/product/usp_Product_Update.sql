CREATE OR ALTER PROCEDURE [dbo].[usp_Product_Update]
    @product_id    INT,
    @name          NVARCHAR(500),
    @description   VARCHAR(1000) = NULL,
    @selling_price DECIMAL(10,2) = NULL,
    @unit_id       INT           = NULL,
    @image_url     VARCHAR(500)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[product]
    SET
        name          = @name,
        description   = @description,
        selling_price = @selling_price,
        unit_id       = @unit_id,
        image_url     = @image_url,
        modified_at   = GETDATE()
    WHERE product_id = @product_id AND is_deleted = 0;

    SELECT @@ROWCOUNT AS rows_affected;
END;
GO

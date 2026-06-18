CREATE OR ALTER PROCEDURE [dbo].[usp_Product_Delete]
    @product_id INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[product]
    SET is_deleted  = 1,
        modified_at = GETDATE()
    WHERE product_id = @product_id AND is_deleted = 0;

    SELECT @@ROWCOUNT AS rows_affected;
END;
GO

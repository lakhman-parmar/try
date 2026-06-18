USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SupplierProduct_Delete]
    @supplier_product_id INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.supplier_product
    SET is_deleted = 1,
        modified_at = GETDATE()
    WHERE supplier_product_id = @supplier_product_id;

    SELECT @@ROWCOUNT AS rows_affected;
END
GO

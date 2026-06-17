USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_GetAllSuppliers]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        supplier_id AS SupplierId,
        name AS Name
    FROM dbo.supplier
    WHERE is_deleted = 0
       OR is_deleted IS NULL
    ORDER BY name;
END
GO

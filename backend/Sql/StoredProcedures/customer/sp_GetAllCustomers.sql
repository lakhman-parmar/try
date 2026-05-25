USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_GetAllCustomers]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        customer_id,
        name,
        email,
        phone,
        address
    FROM dbo.customer
    WHERE is_deleted = 0
    ORDER BY name;
END
GO

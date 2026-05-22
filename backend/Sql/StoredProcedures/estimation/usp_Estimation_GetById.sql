USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Estimation_GetById]
    @estimation_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.estimation_id,
        e.estimation_number,
        e.customer_id,
        c.name AS customer_name,
        e.remarks,
        e.created_at,
        e.modified_at
    FROM dbo.estimation e
    LEFT JOIN dbo.customer c ON c.customer_id = e.customer_id
    WHERE e.estimation_id = @estimation_id
      AND e.is_deleted = 0;

    SELECT
        ei.estimation_item_id,
        ei.product_id,
        p.name AS product_name,
        u.short_name AS unit_short_name,
        ei.quantity
    FROM dbo.estimation_item ei
    INNER JOIN dbo.product p ON p.product_id = ei.product_id
    LEFT JOIN dbo.unit u ON u.unit_id = p.unit_id
    WHERE ei.estimation_id = @estimation_id
      AND ei.is_deleted = 0;
END
GO

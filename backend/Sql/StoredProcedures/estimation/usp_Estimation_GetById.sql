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
        e.modified_at,
        ISNULL(CAST(SUM(ei.quantity * ei.unit_price) AS DECIMAL(10,2)), 0) AS total_amount
    FROM dbo.estimation e
    LEFT JOIN dbo.customer c ON c.customer_id = e.customer_id
    LEFT JOIN dbo.estimation_item ei ON ei.estimation_id = e.estimation_id AND ei.is_deleted = 0
    WHERE e.estimation_id = @estimation_id
      AND e.is_deleted = 0
    GROUP BY
        e.estimation_id,
        e.estimation_number,
        e.customer_id,
        c.name,
        e.remarks,
        e.created_at,
        e.modified_at;

    SELECT
        ei.estimation_item_id,
        ei.product_id,
        p.name AS product_name,
        u.short_name AS unit_short_name,
        ei.quantity,
        ei.unit_price
    FROM dbo.estimation_item ei
    INNER JOIN dbo.product p ON p.product_id = ei.product_id
    LEFT JOIN dbo.unit u ON u.unit_id = p.unit_id
    WHERE ei.estimation_id = @estimation_id
      AND ei.is_deleted = 0;
END
GO

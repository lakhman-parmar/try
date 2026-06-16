-- ============================================================
-- Stored Procedure: usp_SalesOrder_GetEstimationsForSO
-- Returns paginated open estimations with their items, so the
-- UI can pre-fill / select items when creating a new Sales Order.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesOrder_GetEstimationsForSO]
    @customer_id INT,
    @PageNumber INT = 1,
    @PageSize   INT = 20,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Total count for pagination metadata
    SELECT @TotalCount = COUNT(*)
    FROM   dbo.estimation e
    WHERE  e.is_deleted = 0
      AND  e.customer_id = @customer_id
      AND  EXISTS (
        SELECT 1 FROM dbo.estimation_item ei
        WHERE ei.estimation_id = e.estimation_id AND ei.is_deleted = 0
      );

    -- Result set 1: Paged estimation headers
    SELECT
        e.estimation_id,
        e.estimation_number,
        e.remarks,
        e.created_at
    FROM   dbo.estimation e
    WHERE  e.is_deleted = 0
      AND  e.customer_id = @customer_id
      AND  EXISTS (
        SELECT 1 FROM dbo.estimation_item ei
        WHERE ei.estimation_id = e.estimation_id AND ei.is_deleted = 0
      )
    ORDER BY e.created_at DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: Items only for estimations on the current page
    SELECT
        ei.estimation_item_id,
        ei.estimation_id,
        ei.product_id,
        p.name           AS product_name,
        p.selling_price  AS unit_price,
        u.short_name     AS unit_short_name,
        ei.quantity
    FROM   dbo.estimation_item ei
    INNER JOIN dbo.estimation e
           ON e.estimation_id = ei.estimation_id
          AND e.is_deleted = 0
    INNER JOIN dbo.product p
           ON p.product_id = ei.product_id
    LEFT  JOIN dbo.unit u
           ON u.unit_id    = p.unit_id
    WHERE  ei.is_deleted = 0
      AND  ei.estimation_id IN (
        SELECT e2.estimation_id
        FROM   dbo.estimation e2
        WHERE  e2.is_deleted = 0
          AND  e2.customer_id = @customer_id
          AND  EXISTS (
            SELECT 1 FROM dbo.estimation_item ei2
            WHERE ei2.estimation_id = e2.estimation_id AND ei2.is_deleted = 0
          )
        ORDER BY e2.created_at DESC
        OFFSET ((@PageNumber - 1) * @PageSize) ROWS
        FETCH NEXT @PageSize ROWS ONLY
    )
    ORDER BY ei.estimation_id, ei.estimation_item_id;
END
GO

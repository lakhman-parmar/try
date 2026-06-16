-- ============================================================
-- Stored Procedure: usp_SalesInvoice_GetOrdersForInvoice
-- Returns paginated sales orders and items that can be used
-- to create invoices.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_GetOrdersForInvoice]
    @customer_id INT,
    @PageNumber INT = 1,
    @PageSize   INT = 20,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Total count for pagination metadata
    SELECT @TotalCount = COUNT(*)
    FROM   dbo.sales_order so
    WHERE  so.is_deleted = 0
      AND  so.customer_id = @customer_id
      AND  EXISTS (
        SELECT 1 FROM dbo.sales_order_item soi
        WHERE soi.sales_order_id = so.sales_order_id AND soi.is_deleted = 0
      );

    -- Result set 1: Paged sales order headers
    SELECT
        so.sales_order_id,
        so.sales_order_number,
        so.customer_id,
        c.name AS customer_name,
        so.tax_percentage,
        so.remarks,
        so.created_at
    FROM   dbo.sales_order so
    LEFT   JOIN dbo.customer c ON c.customer_id = so.customer_id
    WHERE  so.is_deleted = 0
      AND  so.customer_id = @customer_id
      AND  EXISTS (
        SELECT 1 FROM dbo.sales_order_item soi
        WHERE soi.sales_order_id = so.sales_order_id AND soi.is_deleted = 0
      )
    ORDER BY so.created_at DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: Items only for orders on the current page
    SELECT
        soi.sales_order_item_id,
        soi.sales_order_id,
        soi.product_id,
        p.name           AS product_name,
        u.short_name     AS unit_short_name,
        soi.quantity,
        soi.unit_price,
        p.stock          AS available_stock,
        soi.estimation_id,
        e.estimation_number,
        soi.estimation_item_id
    FROM   dbo.sales_order_item soi
    INNER JOIN dbo.sales_order so
            ON so.sales_order_id = soi.sales_order_id
           AND so.is_deleted = 0
    INNER JOIN dbo.product p ON p.product_id = soi.product_id
    LEFT  JOIN dbo.unit u ON u.unit_id = p.unit_id
    LEFT  JOIN dbo.estimation e ON e.estimation_id = soi.estimation_id
    WHERE  soi.is_deleted = 0
      AND  soi.sales_order_id IN (
        SELECT so2.sales_order_id
        FROM   dbo.sales_order so2
        WHERE  so2.is_deleted = 0
          AND  so2.customer_id = @customer_id
          AND  EXISTS (
            SELECT 1 FROM dbo.sales_order_item soi2
            WHERE soi2.sales_order_id = so2.sales_order_id AND soi2.is_deleted = 0
          )
        ORDER BY so2.created_at DESC
        OFFSET ((@PageNumber - 1) * @PageSize) ROWS
        FETCH NEXT @PageSize ROWS ONLY
      )
    ORDER BY soi.sales_order_id, soi.sales_order_item_id;
END
GO

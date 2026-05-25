-- ============================================================
-- Stored Procedure: usp_SalesOrder_GetAll
-- Returns paginated list of sales orders with filter & search
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesOrder_GetAll]
    @Search      NVARCHAR(200)  = NULL,
    @FromDate    DATETIME2      = NULL,
    @ToDate      DATETIME2      = NULL,
    @CustomerId  INT            = NULL,
    @PageNumber  INT            = 1,
    @PageSize    INT            = 20,
    @TotalCount  INT            OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Total count for pagination ─────────────────────────────────────
    SELECT @TotalCount = COUNT(DISTINCT so.sales_order_id)
    FROM   dbo.sales_order so
    LEFT  JOIN dbo.customer c ON c.customer_id = so.customer_id
    WHERE  so.is_deleted = 0
      AND  (@CustomerId IS NULL OR so.customer_id = @CustomerId)
      AND  (@Search IS NULL
            OR so.sales_order_number LIKE '%' + @Search + '%'
            OR so.remarks           LIKE '%' + @Search + '%'
            OR c.name               LIKE '%' + @Search + '%')
      AND  (@FromDate IS NULL OR so.created_at >= @FromDate)
      AND  (@ToDate   IS NULL OR so.created_at <= @ToDate);

    -- ── Paged result set ───────────────────────────────────────────────
    SELECT
        so.sales_order_id,
        so.sales_order_number,
        so.customer_id,
        c.name          AS customer_name,
        so.tax_percentage,
        so.remarks,
        COUNT(soi.sales_order_item_id)   AS item_count,
        SUM(soi.quantity * soi.unit_price) AS sub_total,
        so.created_at
    FROM   dbo.sales_order so
    LEFT  JOIN dbo.customer c
           ON c.customer_id = so.customer_id
    LEFT  JOIN dbo.sales_order_item soi
           ON soi.sales_order_id = so.sales_order_id
          AND soi.is_deleted = 0
    WHERE  so.is_deleted = 0
      AND  (@CustomerId IS NULL OR so.customer_id = @CustomerId)
      AND  (@Search IS NULL
            OR so.sales_order_number LIKE '%' + @Search + '%'
            OR so.remarks           LIKE '%' + @Search + '%'
            OR c.name               LIKE '%' + @Search + '%')
      AND  (@FromDate IS NULL OR so.created_at >= @FromDate)
      AND  (@ToDate   IS NULL OR so.created_at <= @ToDate)
    GROUP BY
        so.sales_order_id,
        so.sales_order_number,
        so.customer_id,
        c.name,
        so.tax_percentage,
        so.remarks,
        so.created_at
    ORDER BY so.created_at DESC
    OFFSET  (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

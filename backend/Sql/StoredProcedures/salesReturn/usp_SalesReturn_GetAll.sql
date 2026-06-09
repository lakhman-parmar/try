-- ============================================================
-- Stored Procedure: usp_SalesReturn_GetAll
-- Returns paginated list of sales returns with filter and search.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesReturn_GetAll]
    @Search      NVARCHAR(200) = NULL,
    @FromDate    DATETIME2     = NULL,
    @ToDate      DATETIME2     = NULL,
    @CustomerId  INT           = NULL,
    @PageNumber  INT           = 1,
    @PageSize    INT           = 20,
    @TotalCount  INT           OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount = COUNT(DISTINCT sr.sales_return_id)
    FROM dbo.sales_return sr
    LEFT JOIN dbo.customer c ON c.customer_id = sr.customer_id
    LEFT JOIN dbo.sales_invoice si ON si.sales_invoice_id = sr.sales_invoice_id
    WHERE sr.is_deleted = 0
      AND (@CustomerId IS NULL OR sr.customer_id = @CustomerId)
      AND (@Search IS NULL
           OR sr.return_number LIKE '%' + @Search + '%'
           OR sr.remarks LIKE '%' + @Search + '%'
           OR si.invoice_number LIKE '%' + @Search + '%'
           OR c.name LIKE '%' + @Search + '%')
      AND (@FromDate IS NULL OR sr.created_at >= @FromDate)
      AND (@ToDate IS NULL OR sr.created_at < DATEADD(DAY,1,CAST(@ToDate AS DATE)));

    SELECT
        sr.sales_return_id,
        sr.return_number,
        sr.sales_invoice_id,
        si.invoice_number,
        sr.customer_id,
        c.name AS customer_name,
        sr.remarks,
        sr.total_amount,
        COUNT(sri.sales_return_item_id) AS item_count,
        SUM(sri.quantity * sri.unit_price) AS sub_total,
        sr.created_at
    FROM dbo.sales_return sr
    LEFT JOIN dbo.sales_invoice si ON si.sales_invoice_id = sr.sales_invoice_id
    LEFT JOIN dbo.customer c ON c.customer_id = sr.customer_id
    LEFT JOIN dbo.sales_return_item sri
        ON sri.sales_return_id = sr.sales_return_id
       AND sri.is_deleted = 0
    WHERE sr.is_deleted = 0
      AND (@CustomerId IS NULL OR sr.customer_id = @CustomerId)
      AND (@Search IS NULL
           OR sr.return_number LIKE '%' + @Search + '%'
           OR sr.remarks LIKE '%' + @Search + '%'
           OR si.invoice_number LIKE '%' + @Search + '%'
           OR c.name LIKE '%' + @Search + '%')
      AND (@FromDate IS NULL OR sr.created_at >= @FromDate)
      AND (@ToDate IS NULL OR sr.created_at < DATEADD(DAY,1,CAST(@ToDate AS DATE)))
    GROUP BY
        sr.sales_return_id,
        sr.return_number,
        sr.sales_invoice_id,
        si.invoice_number,
        sr.customer_id,
        c.name,
        sr.remarks,
        sr.total_amount,
        sr.created_at
    ORDER BY sr.created_at DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

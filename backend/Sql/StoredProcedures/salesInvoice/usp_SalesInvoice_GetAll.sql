-- ============================================================
-- Stored Procedure: usp_SalesInvoice_GetAll
-- Returns paginated list of sales invoices with filter and search.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_GetAll]
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

    SELECT @TotalCount = COUNT(DISTINCT si.sales_invoice_id)
    FROM dbo.sales_invoice si
    LEFT JOIN dbo.customer c ON c.customer_id = si.customer_id
    LEFT JOIN dbo.sales_order so ON so.sales_order_id = si.sales_order_id
    WHERE si.is_deleted = 0
      AND (@CustomerId IS NULL OR si.customer_id = @CustomerId)
      AND (@Search IS NULL
           OR si.invoice_number LIKE '%' + @Search + '%'
           OR si.remarks LIKE '%' + @Search + '%'
           OR so.sales_order_number LIKE '%' + @Search + '%'
           OR c.name LIKE '%' + @Search + '%')
      AND (@FromDate IS NULL OR si.created_at >= @FromDate)
      AND (@ToDate IS NULL OR si.created_at < DATEADD(DAY,1,CAST(@ToDate AS DATE)));

    SELECT
        si.sales_invoice_id,
        si.invoice_number,
        si.sales_order_id,
        so.sales_order_number,
        si.customer_id,
        c.name AS customer_name,
        si.tax_percentage,
        si.remarks,
        si.total_amount,
        COUNT(sii.sales_invoice_item_id) AS item_count,
        SUM(sii.quantity * sii.unit_price) AS sub_total,
        si.created_at
    FROM dbo.sales_invoice si
    LEFT JOIN dbo.sales_order so ON so.sales_order_id = si.sales_order_id
    LEFT JOIN dbo.customer c ON c.customer_id = si.customer_id
    LEFT JOIN dbo.sales_invoice_item sii
        ON sii.sales_invoice_id = si.sales_invoice_id
       AND sii.is_deleted = 0
    WHERE si.is_deleted = 0
      AND (@CustomerId IS NULL OR si.customer_id = @CustomerId)
      AND (@Search IS NULL
           OR si.invoice_number LIKE '%' + @Search + '%'
           OR si.remarks LIKE '%' + @Search + '%'
           OR so.sales_order_number LIKE '%' + @Search + '%'
           OR c.name LIKE '%' + @Search + '%')
      AND (@FromDate IS NULL OR si.created_at >= @FromDate)
      AND (@ToDate IS NULL OR si.created_at < DATEADD(DAY,1,CAST(@ToDate AS DATE)))
    GROUP BY
        si.sales_invoice_id,
        si.invoice_number,
        si.sales_order_id,
        so.sales_order_number,
        si.customer_id,
        c.name,
        si.tax_percentage,
        si.remarks,
        si.total_amount,
        si.created_at
    ORDER BY si.created_at DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

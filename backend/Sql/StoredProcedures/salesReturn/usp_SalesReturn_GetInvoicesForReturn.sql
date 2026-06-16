-- ============================================================
-- Stored Procedure: usp_SalesReturn_GetInvoicesForReturn
-- Returns sales invoices (paginated) and only invoice items
-- with remaining quantity available to return.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesReturn_GetInvoicesForReturn]
    @CustomerId INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Build returnable items temp table
    SELECT
        sii.sales_invoice_item_id,
        sii.sales_invoice_id,
        sii.product_id,
        sii.quantity,
        ISNULL(ret.returned_quantity, 0) AS returned_quantity,
        sii.quantity - ISNULL(ret.returned_quantity, 0) AS returnable_quantity,
        sii.unit_price
    INTO #ReturnableItems
    FROM dbo.sales_invoice_item sii
    INNER JOIN dbo.sales_invoice si
        ON si.sales_invoice_id = sii.sales_invoice_id
       AND si.is_deleted = 0
    OUTER APPLY (
        SELECT SUM(sri.quantity) AS returned_quantity
        FROM dbo.sales_return_item sri
        INNER JOIN dbo.sales_return sr
            ON sr.sales_return_id = sri.sales_return_id
           AND sr.is_deleted = 0
        WHERE sri.sales_invoice_item_id = sii.sales_invoice_item_id
          AND sri.is_deleted = 0
    ) ret
    WHERE sii.is_deleted = 0
      AND sii.quantity > ISNULL(ret.returned_quantity, 0);

    -- Total count of invoices with returnable items
    SELECT @TotalCount = COUNT(DISTINCT si.sales_invoice_id)
    FROM dbo.sales_invoice si
    INNER JOIN #ReturnableItems ri ON ri.sales_invoice_id = si.sales_invoice_id
    WHERE (@CustomerId IS NULL OR si.customer_id = @CustomerId);

    -- Paginated invoice IDs
    SELECT si.sales_invoice_id
    INTO #PageInvoiceIds
    FROM dbo.sales_invoice si
    INNER JOIN #ReturnableItems ri ON ri.sales_invoice_id = si.sales_invoice_id
    WHERE (@CustomerId IS NULL OR si.customer_id = @CustomerId)
    GROUP BY si.sales_invoice_id
    ORDER BY MAX(si.created_at) DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Invoice headers for paginated IDs
    SELECT
        si.sales_invoice_id,
        si.invoice_number,
        si.customer_id,
        c.name AS customer_name,
        si.remarks,
        si.created_at
    FROM dbo.sales_invoice si
    LEFT JOIN dbo.customer c ON c.customer_id = si.customer_id
    INNER JOIN #PageInvoiceIds pi ON pi.sales_invoice_id = si.sales_invoice_id
    ORDER BY si.created_at DESC;

    -- Items for paginated invoices
    SELECT
        ri.sales_invoice_item_id,
        ri.sales_invoice_id,
        ri.product_id,
        p.name AS product_name,
        u.short_name AS unit_short_name,
        ri.quantity,
        ri.returned_quantity,
        ri.returnable_quantity,
        ri.unit_price
    FROM #ReturnableItems ri
    INNER JOIN dbo.product p ON p.product_id = ri.product_id
    LEFT JOIN dbo.unit u ON u.unit_id = p.unit_id
    INNER JOIN #PageInvoiceIds pi ON pi.sales_invoice_id = ri.sales_invoice_id
    ORDER BY ri.sales_invoice_id, p.name;

    DROP TABLE #ReturnableItems;
    DROP TABLE #PageInvoiceIds;
END
GO

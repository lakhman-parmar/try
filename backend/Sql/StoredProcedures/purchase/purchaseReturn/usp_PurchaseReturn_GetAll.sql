-- ============================================================
-- Stored Procedure: usp_PurchaseReturn_GetAll
-- Returns paginated list of purchase returns with filter & search.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseReturn_GetAll]
    @Search      NVARCHAR(200)  = NULL,
    @FromDate    DATETIME2      = NULL,
    @ToDate      DATETIME2      = NULL,
    @SupplierId  INT            = NULL,
    @PageNumber  INT            = 1,
    @PageSize    INT            = 20,
    @TotalCount  INT            OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount = COUNT(DISTINCT pr.purchase_return_id)
    FROM   dbo.purchase_return pr
    LEFT  JOIN dbo.supplier s ON s.supplier_id = pr.supplier_id
    WHERE  pr.is_deleted = 0
      AND  (@SupplierId IS NULL OR pr.supplier_id = @SupplierId)
      AND  (@Search IS NULL
            OR pr.purchase_return_number LIKE '%' + @Search + '%'
            OR s.name                    LIKE '%' + @Search + '%')
      AND  (@FromDate IS NULL OR pr.created_at >= @FromDate)
      AND  (@ToDate   IS NULL OR pr.created_at < DATEADD(DAY,1,CAST(@ToDate AS DATE)));

    SELECT
        pr.purchase_return_id,
        pr.purchase_return_number,
        pr.supplier_id,
        s.name              AS supplier_name,
        pr.total_amount,
        COUNT(pri.purchase_return_item_id) AS item_count,
        pr.created_at,
        b.bill_number
    FROM   dbo.purchase_return pr
    LEFT  JOIN dbo.supplier s
           ON s.supplier_id = pr.supplier_id
    LEFT  JOIN dbo.purchase_return_item pri
           ON pri.purchase_return_id = pr.purchase_return_id
          AND pri.is_deleted         = 0
    OUTER APPLY (
        SELECT TOP 1 pb.bill_number
        FROM   dbo.purchase_return_item pri2
        INNER  JOIN dbo.purchase_bill pb ON pb.purchase_bill_id = pri2.purchase_bill_id
        WHERE  pri2.purchase_return_id = pr.purchase_return_id
          AND  pri2.is_deleted = 0
    ) b
    WHERE  pr.is_deleted = 0
      AND  (@SupplierId IS NULL OR pr.supplier_id = @SupplierId)
      AND  (@Search IS NULL
            OR pr.purchase_return_number LIKE '%' + @Search + '%'
            OR s.name                    LIKE '%' + @Search + '%')
      AND  (@FromDate IS NULL OR pr.created_at >= @FromDate)
      AND  (@ToDate   IS NULL OR pr.created_at < DATEADD(DAY,1,CAST(@ToDate AS DATE)))
    GROUP BY
        pr.purchase_return_id,
        pr.purchase_return_number,
        pr.supplier_id,
        s.name,
        pr.total_amount,
        pr.created_at,
        b.bill_number
    ORDER BY pr.created_at DESC
    OFFSET  (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

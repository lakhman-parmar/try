-- ============================================================
-- Stored Procedure: usp_PurchaseBill_GetAll
-- Returns paginated list of purchase bills with filter & search
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseBill_GetAll]
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

    -- ── Total count for pagination ──────────────────────────────────────
    SELECT @TotalCount = COUNT(DISTINCT pb.purchase_bill_id)
    FROM   dbo.purchase_bill pb
    LEFT  JOIN dbo.supplier s ON s.supplier_id = pb.supplier_id
    WHERE  pb.is_deleted = 0
      AND  (@SupplierId IS NULL OR pb.supplier_id = @SupplierId)
      AND  (@Search IS NULL
            OR pb.bill_number  LIKE '%' + @Search + '%'
            OR s.name          LIKE '%' + @Search + '%')
      AND  (@FromDate IS NULL OR pb.created_at >= @FromDate)
      AND  (@ToDate   IS NULL OR pb.created_at <= @ToDate);

    -- ── Paged result set ────────────────────────────────────────────────
    SELECT
        pb.purchase_bill_id,
        pb.bill_number,
        pb.supplier_id,
        s.name              AS supplier_name,
        pb.tax_percentage,
        pb.total_amount,
        COUNT(pbi.purchase_bill_item_id) AS item_count,
        pb.created_at
    FROM   dbo.purchase_bill pb
    LEFT  JOIN dbo.supplier s
           ON s.supplier_id = pb.supplier_id
    LEFT  JOIN dbo.purchase_bill_item pbi
           ON pbi.purchase_bill_id = pb.purchase_bill_id
          AND pbi.is_deleted = 0
    WHERE  pb.is_deleted = 0
      AND  (@SupplierId IS NULL OR pb.supplier_id = @SupplierId)
      AND  (@Search IS NULL
            OR pb.bill_number  LIKE '%' + @Search + '%'
            OR s.name          LIKE '%' + @Search + '%')
      AND  (@FromDate IS NULL OR pb.created_at >= @FromDate)
      AND  (@ToDate   IS NULL OR pb.created_at <= @ToDate)
    GROUP BY
        pb.purchase_bill_id,
        pb.bill_number,
        pb.supplier_id,
        s.name,
        pb.tax_percentage,
        pb.total_amount,
        pb.created_at
    ORDER BY pb.created_at DESC
    OFFSET  (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

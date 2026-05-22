-- ============================================================
-- Stored Procedure: usp_PurchaseOrder_GetAll
-- Returns paginated list of purchase orders with filter & search
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_GetAll]
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
    SELECT @TotalCount = COUNT(DISTINCT po.purchase_order_id)
    FROM   dbo.purchase_order po
    LEFT  JOIN dbo.supplier s ON s.supplier_id = po.supplier_id
    WHERE  po.is_deleted = 0
      AND  (@SupplierId IS NULL OR po.supplier_id = @SupplierId)
      AND  (@Search IS NULL
            OR po.po_number   LIKE '%' + @Search + '%'
            OR po.remarks     LIKE '%' + @Search + '%'
            OR s.name         LIKE '%' + @Search + '%')
      AND  (@FromDate IS NULL OR po.created_at >= @FromDate)
      AND  (@ToDate   IS NULL OR po.created_at <= @ToDate);

    -- ── Paged result set ────────────────────────────────────────────────
    SELECT
        po.purchase_order_id,
        po.po_number,
        po.supplier_id,
        s.name          AS supplier_name,
        po.tax_percentage,
        po.remarks,
        COUNT(poi.purchase_order_item_id)   AS item_count,
        SUM(poi.quantity * poi.unit_price)  AS sub_total,
        po.created_at
    FROM   dbo.purchase_order po
    LEFT  JOIN dbo.supplier s
           ON s.supplier_id = po.supplier_id
    LEFT  JOIN dbo.purchase_order_item poi
           ON poi.purchase_order_id = po.purchase_order_id
          AND poi.is_deleted = 0
    WHERE  po.is_deleted = 0
      AND  (@SupplierId IS NULL OR po.supplier_id = @SupplierId)
      AND  (@Search IS NULL
            OR po.po_number   LIKE '%' + @Search + '%'
            OR po.remarks     LIKE '%' + @Search + '%'
            OR s.name         LIKE '%' + @Search + '%')
      AND  (@FromDate IS NULL OR po.created_at >= @FromDate)
      AND  (@ToDate   IS NULL OR po.created_at <= @ToDate)
    GROUP BY
        po.purchase_order_id,
        po.po_number,
        po.supplier_id,
        s.name,
        po.tax_percentage,
        po.remarks,
        po.created_at
    ORDER BY po.created_at DESC
    OFFSET  (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

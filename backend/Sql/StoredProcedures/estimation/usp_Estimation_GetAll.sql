USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Estimation_GetAll]
    @Search     NVARCHAR(200) = NULL,
    @FromDate   DATETIME2 = NULL,
    @ToDate     DATETIME2 = NULL,
    @CustomerId INT = NULL,
    @PageNumber INT = 1,
    @PageSize   INT = 20,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount = COUNT(*)
    FROM dbo.estimation e
    LEFT JOIN dbo.customer c ON c.customer_id = e.customer_id
    WHERE e.is_deleted = 0
      AND (@CustomerId IS NULL OR e.customer_id = @CustomerId)
      AND (@Search IS NULL
           OR e.estimation_number LIKE '%' + @Search + '%'
           OR e.remarks LIKE '%' + @Search + '%'
           OR c.name LIKE '%' + @Search + '%')
      AND (@FromDate IS NULL OR e.created_at >= @FromDate)
      AND (@ToDate IS NULL OR e.created_at <= @ToDate);

    SELECT
        e.estimation_id,
        e.estimation_number,
        e.customer_id,
        c.name AS customer_name,
        e.remarks,
        COUNT(ei.estimation_item_id) AS item_count,
        e.created_at
    FROM dbo.estimation e
    LEFT JOIN dbo.customer c ON c.customer_id = e.customer_id
    LEFT JOIN dbo.estimation_item ei
           ON ei.estimation_id = e.estimation_id
          AND ei.is_deleted = 0
    WHERE e.is_deleted = 0
      AND (@CustomerId IS NULL OR e.customer_id = @CustomerId)
      AND (@Search IS NULL
           OR e.estimation_number LIKE '%' + @Search + '%'
           OR e.remarks LIKE '%' + @Search + '%'
           OR c.name LIKE '%' + @Search + '%')
      AND (@FromDate IS NULL OR e.created_at >= @FromDate)
      AND (@ToDate IS NULL OR e.created_at <= @ToDate)
    GROUP BY
        e.estimation_id,
        e.estimation_number,
        e.customer_id,
        c.name,
        e.remarks,
        e.created_at
    ORDER BY e.created_at DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

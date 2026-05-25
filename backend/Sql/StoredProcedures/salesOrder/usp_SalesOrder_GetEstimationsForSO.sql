-- ============================================================
-- Stored Procedure: usp_SalesOrder_GetEstimationsForSO
-- Returns all open estimations with their items, so the UI
-- can pre-fill a new Sales Order.
-- ============================================================
USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesOrder_GetEstimationsForSO]
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Result set 1: Estimation headers ───────────────────────────────
    SELECT DISTINCT
        e.estimation_id,
        e.estimation_number,
        e.remarks,
        e.created_at
    FROM   dbo.estimation e
    INNER JOIN dbo.estimation_item ei
           ON ei.estimation_id = e.estimation_id
          AND ei.is_deleted = 0
    WHERE  e.is_deleted = 0
    ORDER BY e.created_at DESC;

    -- ── Result set 2: All items of those estimations ───────────────────
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
    ORDER BY ei.estimation_id, ei.estimation_item_id;
END
GO

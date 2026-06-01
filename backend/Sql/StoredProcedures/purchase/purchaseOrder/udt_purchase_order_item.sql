-- ============================================================
-- User-Defined Table Type: dbo.udt_purchase_order_item
-- Used as TVP in usp_PurchaseOrder_Create / Update
-- ============================================================
USE [dbRapidDevs]
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.types WHERE is_table_type = 1 AND name = 'udt_purchase_order_item'
)
BEGIN
    CREATE TYPE [dbo].[udt_purchase_order_item] AS TABLE
    (
        [ProductId]         INT             NOT NULL,
        [RequisitionId]     INT             NULL,
        [RequisitionItemId] INT             NULL,
        [Quantity]          DECIMAL(18, 4)  NOT NULL,
        [UnitPrice]         DECIMAL(18, 4)  NULL
    );
END
GO

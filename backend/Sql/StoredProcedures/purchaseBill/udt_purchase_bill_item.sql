-- ============================================================
-- User-Defined Table Type: dbo.udt_purchase_bill_item
-- Used as TVP in usp_PurchaseBill_Create
-- ============================================================
USE [dbRapidDevs]
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.types WHERE is_table_type = 1 AND name = 'udt_purchase_bill_item'
)
BEGIN
    CREATE TYPE [dbo].[udt_purchase_bill_item] AS TABLE
    (
        [ProductId]          INT             NOT NULL,
        [PurchaseOrderId]    INT             NULL,   -- NULL when item is added directly (not from a PO)
        [PurchaseOrderItemId]INT             NULL,   -- NULL when item is added directly
        [Quantity]           DECIMAL(18, 4)  NOT NULL,
        [UnitPrice]          DECIMAL(18, 4)  NULL    -- NULL = resolved from product.purchase_price
    );
END
GO

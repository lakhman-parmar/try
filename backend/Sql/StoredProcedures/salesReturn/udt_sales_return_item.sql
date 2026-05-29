-- ============================================================
-- User-Defined Table Type: dbo.udt_sales_return_item
-- Used as TVP in usp_SalesReturn_Create
-- ============================================================
USE [dbRapidDevs]
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.types WHERE is_table_type = 1 AND name = 'udt_sales_return_item'
)
BEGIN
    CREATE TYPE [dbo].[udt_sales_return_item] AS TABLE
    (
        [ProductId]          INT             NOT NULL,
        [SalesInvoiceId]     INT             NOT NULL,
        [SalesInvoiceItemId] INT             NOT NULL,
        [Quantity]           DECIMAL(18, 4)  NOT NULL,
        [UnitPrice]          DECIMAL(18, 4)  NULL
    );
END
GO

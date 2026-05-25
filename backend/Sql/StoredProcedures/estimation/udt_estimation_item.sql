USE [dbRapidDevs]
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.types WHERE is_table_type = 1 AND name = 'udt_estimation_item'
)
BEGIN
    CREATE TYPE [dbo].[udt_estimation_item] AS TABLE
    (
        product_id INT NOT NULL,
        quantity   DECIMAL(18,3) NOT NULL
    );
END
GO

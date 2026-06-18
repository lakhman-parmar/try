USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_Create]
    @supplier_id INT,
    @tax_percentage DECIMAL(5, 2) = NULL,
    @remarks NVARCHAR(1000) = NULL,
    @items dbo.udt_purchase_order_item READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        IF EXISTS (
            SELECT 1
            FROM @items i
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.supplier_product sp
                WHERE sp.product_id = i.ProductId
                  AND sp.supplier_id = @supplier_id
                  AND sp.is_deleted = 0
            )
        )
            THROW 50001, 'One or more products are not supplied by the selected supplier.', 1;

        IF EXISTS (
            SELECT 1
            FROM @items i
            INNER JOIN dbo.purchase_requisition pr
                ON pr.purchase_requisition_id = i.RequisitionId
            WHERE i.RequisitionId IS NOT NULL
              AND pr.supplier_id <> @supplier_id
        )
            THROW 50002, 'A linked requisition belongs to a different supplier.', 1;

        DECLARE @date_part NVARCHAR(8) = CONVERT(NVARCHAR(8), GETDATE(), 112);
        DECLARE @seq_prefix NVARCHAR(20) = 'PO-' + @date_part + '-';
        DECLARE @next_seq INT;
        DECLARE @new_id INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(po_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.purchase_order
        WHERE po_number LIKE @seq_prefix + '%';

        DECLARE @po_number NVARCHAR(50) =
            @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);

        INSERT INTO dbo.purchase_order
            (po_number, supplier_id, tax_percentage, remarks, created_at, is_deleted)
        VALUES
            (@po_number, @supplier_id, @tax_percentage, @remarks, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();

        INSERT INTO dbo.purchase_order_item
            (purchase_order_id, product_id, requisition_id, requisition_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            i.ProductId,
            i.RequisitionId,
            i.RequisitionItemId,
            i.Quantity,
            ISNULL(i.UnitPrice, sp.purchase_price),
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId
        LEFT JOIN dbo.supplier_product sp 
            ON sp.product_id = i.ProductId 
           AND sp.supplier_id = @supplier_id 
           AND sp.is_deleted = 0;

        COMMIT TRANSACTION;
        SELECT @new_id AS new_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO
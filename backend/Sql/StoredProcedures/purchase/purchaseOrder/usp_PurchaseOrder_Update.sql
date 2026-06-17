USE [dbRapidDevs]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [dbo].[usp_PurchaseOrder_Update]
    @purchase_order_id INT,
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

        UPDATE dbo.purchase_order
        SET supplier_id = @supplier_id,
            tax_percentage = @tax_percentage,
            remarks = @remarks,
            modified_at = GETDATE()
        WHERE purchase_order_id = @purchase_order_id
          AND is_deleted = 0;

        DECLARE @rows_affected INT = @@ROWCOUNT;
        IF @rows_affected = 0
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS rows_affected;
            RETURN;
        END;

        UPDATE dbo.purchase_order_item
        SET is_deleted = 1,
            modified_at = GETDATE()
        WHERE purchase_order_id = @purchase_order_id
          AND is_deleted = 0;

        INSERT INTO dbo.purchase_order_item
            (purchase_order_id, product_id, requisition_id, requisition_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @purchase_order_id,
            i.ProductId,
            i.RequisitionId,
            i.RequisitionItemId,
            i.Quantity,
            ISNULL(i.UnitPrice, p.purchase_price),
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        COMMIT TRANSACTION;
        SELECT @rows_affected AS rows_affected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO
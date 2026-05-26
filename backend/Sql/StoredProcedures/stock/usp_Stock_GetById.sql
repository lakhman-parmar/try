CREATE OR ALTER PROCEDURE usp_Stock_GetById
    @product_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: product stock summary
    SELECT
        p.product_id,
        p.name,
        p.description,
        p.selling_price,
        p.purchase_price,
        p.stock,
        u.short_name AS unit_short_name
    FROM   [product] p
    LEFT JOIN [unit] u ON u.unit_id = p.unit_id
    WHERE  p.product_id = @product_id
      AND  p.is_deleted = 0;

    -- Result set 2: stock movement history (purchases add, sales deduct)
    SELECT
        sr.stock_record_id,
        sr.record_type,      -- 0 = Sales, 1 = Purchase  (RecordType enum)
        sr.transaction_id,
        sr.quantity_change,
        sr.price,
        sr.reason,
        sr.created_at
    FROM   [stock_record] sr
    WHERE  sr.product_id = @product_id
    ORDER BY sr.created_at DESC;
END;
GO

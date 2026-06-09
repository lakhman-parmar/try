USE [dbRapidDevs]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_SalesInvoice_Create]
    @customer_id    INT            = NULL,   -- optional, 
    @tax_percentage DECIMAL(5, 2)  = NULL,   -- e.g. 18.00 means 18% tax
    @remarks        NVARCHAR(1000) = NULL,   -- any note the user wants to add
    @items          dbo.udt_sales_invoice_item READONLY  -- the list of products being invoiced
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;  -- start a transaction so if anything fails, we roll EVERYTHING back

    BEGIN TRY

        -- =====================================================
        -- CHECK 1: Did the user actually send any items?
        -- We can't create an invoice with an empty list.
        -- =====================================================
        IF NOT EXISTS (SELECT 1 FROM @items)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50100, 'At least one item is required to create a sales invoice.', 1;
        END


        -- =====================================================
        -- CHECK 2: Are all the products in the list real and active?
        -- We loop through each item and check if its product
        -- exists in the product table and is NOT deleted.
        -- If even ONE product is invalid, we stop everything.
        -- =====================================================
        IF EXISTS (
            SELECT 1
            FROM @items i
            WHERE NOT EXISTS (
                -- "does a valid, non-deleted product exist for this item?"
                SELECT 1
                FROM dbo.product p
                WHERE p.product_id = i.ProductId
                  AND p.is_deleted = 0
            )
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50101, 'One or more products are invalid or deleted.', 1;
        END


        -- =====================================================
        -- CHECK 3: If any item is linked to a sales order,
        -- make sure that link is real and consistent.
        -- We verify that the SalesOrderItemId, SalesOrderId,
        -- and ProductId all match together in the database.
        -- A mismatch means someone sent bad/fake data.
        -- =====================================================
        IF EXISTS (
            SELECT 1
            FROM @items i
            WHERE i.SalesOrderItemId IS NOT NULL  -- only check items that claim to have an order
              AND NOT EXISTS (
                  -- "does this exact combination exist in the real sales order?"
                  SELECT 1
                  FROM dbo.sales_order_item soi
                  INNER JOIN dbo.sales_order so
                      ON so.sales_order_id = soi.sales_order_id
                     AND so.is_deleted = 0
                  WHERE soi.sales_order_item_id = i.SalesOrderItemId
                    AND soi.sales_order_id      = i.SalesOrderId
                    AND soi.product_id          = i.ProductId
                    AND soi.is_deleted          = 0
              )
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50102, 'One or more sales order item references are invalid.', 1;
        END


        -- =====================================================
        -- AUTO-RESOLVE CUSTOMER:
        -- If the caller didn't pass a customer_id,
        -- we try to figure it out from the linked sales orders.
        -- We just grab the customer from one of those orders.
        -- =====================================================
        DECLARE @resolved_customer_id INT = @customer_id;

        IF @resolved_customer_id IS NULL
        BEGIN
            SELECT @resolved_customer_id = MIN(so.customer_id)
            FROM @items i
            INNER JOIN dbo.sales_order so
                ON so.sales_order_id = i.SalesOrderId
               AND so.is_deleted = 0;
        END


        -- =====================================================
        -- CHECK 4: All items must belong to the SAME customer.
        -- You can't mix items from Customer A and Customer B
        -- in a single invoice. That makes no sense.
        -- =====================================================
        IF (
            SELECT COUNT(DISTINCT so.customer_id)
            FROM @items i
            INNER JOIN dbo.sales_order so
                ON so.sales_order_id = i.SalesOrderId
               AND so.is_deleted = 0
            WHERE so.customer_id IS NOT NULL
        ) > 1
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50103, 'Items in a sales invoice must belong to the same customer.', 1;
        END


        -- =====================================================
        -- CHECK 5: If a customer_id WAS passed in manually,
        -- make sure it matches the customer on the sales orders.
        -- Example: You said "this is for Customer 5"
        -- but the orders are for Customer 9 — that's wrong.
        -- =====================================================
        IF @resolved_customer_id IS NOT NULL
           AND EXISTS (
               SELECT 1
               FROM @items i
               INNER JOIN dbo.sales_order so
                   ON so.sales_order_id = i.SalesOrderId
                  AND so.is_deleted = 0
               WHERE so.customer_id IS NOT NULL
                 AND so.customer_id <> @resolved_customer_id  -- mismatch found!
           )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50104, 'Selected sales order items do not match the invoice customer.', 1;
        END


        -- =====================================================
        -- CHECK 6: Do we have enough stock for each product?
        -- We group by product and sum up requested quantities.
        -- If any product's stock is less than what's needed,
        -- we stop — we can't sell what we don't have.
        -- =====================================================
        IF EXISTS (
            SELECT 1
            FROM @items i
            INNER JOIN dbo.product p ON p.product_id = i.ProductId
            GROUP BY i.ProductId, p.stock
            HAVING ISNULL(p.stock, 0) < SUM(i.Quantity)  -- "do we have less than needed?"
        )
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50105, 'Insufficient stock for one or more invoice items.', 1;
        END


        -- =====================================================
        -- GENERATE INVOICE NUMBER
        -- Format: INV-YYYYMMDD-0001
        -- We check how many invoices already exist for today
        -- and increment the sequence by 1.
        -- Example: if INV-20260609-0003 exists, next is INV-20260609-0004
        -- =====================================================
        DECLARE @date_part  NVARCHAR(8)  = CONVERT(NVARCHAR(8), GETDATE(), 112);  -- "20260609"
        DECLARE @seq_prefix NVARCHAR(20) = 'INV-' + @date_part + '-';             -- "INV-20260609-"
        DECLARE @next_seq   INT;

        SELECT @next_seq = ISNULL(MAX(
            CAST(SUBSTRING(invoice_number, LEN(@seq_prefix) + 1, 10) AS INT)
        ), 0) + 1
        FROM dbo.sales_invoice
        WHERE invoice_number LIKE @seq_prefix + '%';
        -- if no invoice exists today, MAX returns NULL → ISNULL gives 0 → +1 = starts at 1

        DECLARE @invoice_number NVARCHAR(50) = @seq_prefix + RIGHT('0000' + CAST(@next_seq AS NVARCHAR), 4);
        -- RIGHT('0000' + '3', 4) = '0003' → zero-padded to always be 4 digits


        -- =====================================================
        -- CALCULATE SUBTOTAL AND TOTAL
        -- Subtotal = sum of (quantity × unit price) for all items
        -- If no unit price was provided, fall back to the
        -- product's default selling price.
        -- Total = subtotal + tax
        -- =====================================================
        DECLARE @subtotal DECIMAL(18, 4);

        SELECT @subtotal = SUM(i.Quantity * ISNULL(i.UnitPrice, p.selling_price))
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;

        DECLARE @total_amount DECIMAL(18, 4) =
            @subtotal + ISNULL(@subtotal * @tax_percentage / 100, 0);
        -- if tax is NULL, we treat it as 0 (no tax)


        -- =====================================================
        -- FIGURE OUT THE HEADER SALES ORDER ID
        -- The invoice header has one sales_order_id column.
        -- We only fill it if ALL items come from the same order.
        -- If items come from multiple orders, we leave it NULL.
        -- =====================================================
        DECLARE @header_sales_order_id INT = NULL;

        IF (SELECT COUNT(DISTINCT SalesOrderId) FROM @items WHERE SalesOrderId IS NOT NULL) = 1
        BEGIN
            SELECT @header_sales_order_id = MIN(SalesOrderId)
            FROM @items
            WHERE SalesOrderId IS NOT NULL;
        END


        -- =====================================================
        -- INSERT THE INVOICE HEADER
        -- This is the main invoice record — one row per invoice.
        -- We capture the new ID using SCOPE_IDENTITY()
        -- so we can use it for the line items below.
        -- =====================================================
        DECLARE @new_id INT;

        INSERT INTO dbo.sales_invoice
            (invoice_number, sales_order_id, customer_id, tax_percentage, remarks, total_amount, created_at, is_deleted)
        VALUES
            (@invoice_number, @header_sales_order_id, @resolved_customer_id, @tax_percentage, @remarks, @total_amount, GETDATE(), 0);

        SET @new_id = SCOPE_IDENTITY();  -- grab the ID of the row we just inserted


        -- =====================================================
        -- INSERT THE INVOICE LINE ITEMS
        -- One row per item in the TVP.
        -- Again, if no unit price was given, use the product's
        -- default selling price.
        -- =====================================================
        INSERT INTO dbo.sales_invoice_item
            (sales_invoice_id, product_id, sales_order_id, sales_order_item_id,
             quantity, unit_price, created_at, is_deleted)
        SELECT
            @new_id,
            i.ProductId,
            i.SalesOrderId,
            i.SalesOrderItemId,
            i.Quantity,
            ISNULL(i.UnitPrice, p.selling_price),  -- use passed price, else fall back to default
            GETDATE(),
            0
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;


        -- =====================================================
        -- DEDUCT STOCK
        -- We sold these products, so reduce their stock.
        -- We group by ProductId first in case the same product
        -- appears on multiple lines — we deduct the total at once.
        -- =====================================================
        UPDATE p
        SET    p.stock       = p.stock - x.Quantity,
               p.modified_at = GETDATE()
        FROM dbo.product p
        INNER JOIN (
            SELECT ProductId, SUM(Quantity) AS Quantity  -- total qty per product
            FROM @items
            GROUP BY ProductId
        ) x ON x.ProductId = p.product_id;


        -- =====================================================
        -- WRITE STOCK RECORDS (audit trail)
        -- Every stock movement gets logged here.
        -- record_type = 0 means "sale" (stock going OUT)
        -- quantity_change is NEGATIVE because stock decreased.
        -- reason column tells you which invoice caused it.
        -- =====================================================
        INSERT INTO dbo.stock_record
            (product_id, record_type, transaction_id, quantity_change, price, reason, created_at)
        SELECT
            i.ProductId,
            0,                                         -- 0 = sale
            @new_id,                                   -- the invoice that caused this
            -i.Quantity,                               -- negative = stock went out
            ISNULL(i.UnitPrice, p.selling_price),
            'Sales Invoice: ' + @invoice_number,       -- e.g. "Sales Invoice: INV-20260609-0001"
            GETDATE()
        FROM @items i
        INNER JOIN dbo.product p ON p.product_id = i.ProductId;


        -- =====================================================
        -- ALL GOOD — COMMIT EVERYTHING
        -- All inserts and updates are saved to the database.
        -- Return the new invoice ID to the caller.
        -- =====================================================
        COMMIT TRANSACTION;

        SELECT @new_id AS new_id;

    END TRY
    BEGIN CATCH
        -- =====================================================
        -- SOMETHING WENT WRONG — ROLL EVERYTHING BACK
        -- None of the inserts or updates will be saved.
        -- The error is re-thrown so the caller knows what happened.
        -- =====================================================
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO
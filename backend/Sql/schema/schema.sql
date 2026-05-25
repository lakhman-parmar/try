
CREATE TABLE [admin] (
    admin_id      INT            IDENTITY(1,1)  PRIMARY KEY,
    name          NVARCHAR(200)  NOT NULL,
    email         VARCHAR(400)   NOT NULL UNIQUE,
    password_hash VARCHAR(256),
    created_at    DATETIME2      DEFAULT GETDATE(),
    modified_at   DATETIME2
);
GO

CREATE TABLE [refresh_token] (
    refresh_token_id INT           IDENTITY(1,1) PRIMARY KEY,
    admin_id         INT,
    token_hash       VARCHAR(64),
    is_revoked       BIT           DEFAULT 0,
    created_at       DATETIME2     DEFAULT GETDATE(),
    expired_at       DATETIME2,

    CONSTRAINT FK_refresh_token_admin FOREIGN KEY (admin_id)
        REFERENCES [admin] (admin_id)
);
GO

CREATE TABLE [supplier] (
    supplier_id  INT            IDENTITY(1,1) PRIMARY KEY,
    name         NVARCHAR(200)  NOT NULL,
    email        VARCHAR(400)   NOT NULL UNIQUE,
    phone        VARCHAR(15),
    address      VARCHAR(500),
    created_at   DATETIME2      DEFAULT GETDATE(),
    modified_at  DATETIME2,
    is_deleted   BIT            DEFAULT 0
);
GO

CREATE TABLE [customer] (
    customer_id  INT            IDENTITY(1,1) PRIMARY KEY,
    name         NVARCHAR(200)  NOT NULL,
    email        VARCHAR(400)   NOT NULL UNIQUE,
    phone        VARCHAR(15),
    address      VARCHAR(500),
    created_at   DATETIME2      DEFAULT GETDATE(),
    modified_at  DATETIME2,
    is_deleted   BIT            DEFAULT 0
);
GO

CREATE TABLE [unit] (
    unit_id      INT           IDENTITY(1,1) PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL UNIQUE,
    short_name   VARCHAR(20)   NOT NULL UNIQUE,
    description  VARCHAR(200),
    created_at   DATETIME2     DEFAULT GETDATE(),
    modified_at  DATETIME2,
    is_deleted   BIT           DEFAULT 0
);
GO

CREATE TABLE [product] (
    product_id      INT             IDENTITY(1,1) PRIMARY KEY,
    image_url       VARCHAR(500),
    name            NVARCHAR(500)   NOT NULL,
    description     VARCHAR(1000),
    selling_price   DECIMAL(10,2),
    purchase_price  DECIMAL(10,2),
    stock           DECIMAL(18,3),
    unit_id         INT,
    created_at      DATETIME2       DEFAULT GETDATE(),
    modified_at     DATETIME2,
    is_deleted      BIT             DEFAULT 0,

    CONSTRAINT FK_product_unit FOREIGN KEY (unit_id)
        REFERENCES [unit] (unit_id)
);
GO

CREATE TABLE [supplier_product] (
    supplier_product_id INT       IDENTITY(1,1) PRIMARY KEY,
    product_id          INT,
    supplier_id         INT,
    created_at          DATETIME2 DEFAULT GETDATE(),
    modified_at         DATETIME2,
    is_deleted          BIT       DEFAULT 0,

    CONSTRAINT FK_supplier_product_product  FOREIGN KEY (product_id)
        REFERENCES [product] (product_id),
    CONSTRAINT FK_supplier_product_supplier FOREIGN KEY (supplier_id)
        REFERENCES [supplier] (supplier_id)
);
GO

CREATE TABLE [price_history] (
    price_history_id INT           IDENTITY(1,1) PRIMARY KEY,
    product_id       INT,
    old_price        DECIMAL(10,2) NOT NULL,
    new_price        DECIMAL(10,2) NOT NULL,
    created_at       DATETIME2     DEFAULT GETDATE(),

    CONSTRAINT FK_price_history_product FOREIGN KEY (product_id)
        REFERENCES [product] (product_id)
);
GO

CREATE TABLE [stock_record] (
    stock_record_id  INT            IDENTITY(1,1) PRIMARY KEY,
    product_id       INT,
    record_type      INT,           -- sales | purchase
    transaction_id   INT            NOT NULL,
    quantity_change  DECIMAL(18,3),
    price            DECIMAL(10,2),
    reason           VARCHAR(30),
    created_at       DATETIME2      DEFAULT GETDATE(),

    CONSTRAINT FK_stock_record_product FOREIGN KEY (product_id)
        REFERENCES [product] (product_id)
);
GO

CREATE TABLE [purchase_requisition] (
    purchase_requisition_id INT           IDENTITY(1,1) PRIMARY KEY,
    requisition_no          VARCHAR(50)   NOT NULL UNIQUE,
    remarks                 VARCHAR(1000),
    created_at              DATETIME2     DEFAULT GETDATE(),
    modified_at             DATETIME2,
    is_deleted              BIT           DEFAULT 0
);
GO

CREATE TABLE [purchase_requisition_item] (
    purchase_requisition_item_id INT           IDENTITY(1,1) PRIMARY KEY,
    requisition_id               INT,
    product_id                   INT,
    quantity                     DECIMAL(18,3),
    created_at                   DATETIME2     DEFAULT GETDATE(),
    modified_at                  DATETIME2,
    is_deleted                   BIT           DEFAULT 0,

    CONSTRAINT FK_pr_item_requisition FOREIGN KEY (requisition_id)
        REFERENCES [purchase_requisition] (purchase_requisition_id),
    CONSTRAINT FK_pr_item_product FOREIGN KEY (product_id)
        REFERENCES [product] (product_id)
);
GO

CREATE TABLE [purchase_order] (
    purchase_order_id INT            IDENTITY(1,1) PRIMARY KEY,
    po_number         VARCHAR(50)    NOT NULL UNIQUE,
    supplier_id       INT,
    tax_percentage    DECIMAL(10,2),
    remarks           VARCHAR(1000),
    created_at        DATETIME2      DEFAULT GETDATE(),
    modified_at       DATETIME2,
    is_deleted        BIT            DEFAULT 0,

    CONSTRAINT FK_purchase_order_supplier FOREIGN KEY (supplier_id)
        REFERENCES [supplier] (supplier_id)
);
GO

CREATE TABLE [purchase_order_item] (
    purchase_order_item_id  INT           IDENTITY(1,1) PRIMARY KEY,
    purchase_order_id       INT,
    product_id              INT,
    requisition_id          INT,
    requisition_item_id     INT,
    quantity                DECIMAL(18,3),
    unit_price              DECIMAL(10,2),
    created_at              DATETIME2     DEFAULT GETDATE(),
    modified_at             DATETIME2,
    is_deleted              BIT           DEFAULT 0,

    CONSTRAINT FK_po_item_purchase_order    FOREIGN KEY (purchase_order_id)
        REFERENCES [purchase_order] (purchase_order_id),
    CONSTRAINT FK_po_item_product           FOREIGN KEY (product_id)
        REFERENCES [product] (product_id),
    CONSTRAINT FK_po_item_requisition       FOREIGN KEY (requisition_id)
        REFERENCES [purchase_requisition] (purchase_requisition_id),
    CONSTRAINT FK_po_item_requisition_item  FOREIGN KEY (requisition_item_id)
        REFERENCES [purchase_requisition_item] (purchase_requisition_item_id)
);
GO

CREATE TABLE [purchase_bill] (
    purchase_bill_id INT            IDENTITY(1,1) PRIMARY KEY,
    bill_number      VARCHAR(50)    NOT NULL UNIQUE,
    supplier_id      INT,
    tax_percentage   DECIMAL(10,2),
    total_amount     DECIMAL(10,2),
    created_at       DATETIME2      DEFAULT GETDATE(),
    modified_at      DATETIME2,
    is_deleted       BIT            DEFAULT 0,

    CONSTRAINT FK_purchase_bill_supplier FOREIGN KEY (supplier_id)
        REFERENCES [supplier] (supplier_id)
);
GO

CREATE TABLE [purchase_bill_item] (
    purchase_bill_item_id    INT           IDENTITY(1,1) PRIMARY KEY,
    purchase_bill_id         INT,
    product_id               INT,
    purchase_order_id        INT,
    purchase_order_item_id   INT,
    quantity                 DECIMAL(18,3),
    unit_price               DECIMAL(10,2),
    created_at               DATETIME2     DEFAULT GETDATE(),
    modified_at              DATETIME2,
    is_deleted               BIT           DEFAULT 0,

    CONSTRAINT FK_pb_item_purchase_bill       FOREIGN KEY (purchase_bill_id)
        REFERENCES [purchase_bill] (purchase_bill_id),
    CONSTRAINT FK_pb_item_product             FOREIGN KEY (product_id)
        REFERENCES [product] (product_id),
    CONSTRAINT FK_pb_item_purchase_order      FOREIGN KEY (purchase_order_id)
        REFERENCES [purchase_order] (purchase_order_id),
    CONSTRAINT FK_pb_item_purchase_order_item FOREIGN KEY (purchase_order_item_id)
        REFERENCES [purchase_order_item] (purchase_order_item_id)
);
GO

CREATE TABLE [estimation] (
    estimation_id     INT            IDENTITY(1,1) PRIMARY KEY,
    estimation_number VARCHAR(50)    NOT NULL UNIQUE,
    customer_id       INT,
    remarks           VARCHAR(1000),
    created_at        DATETIME2      DEFAULT GETDATE(),
    modified_at       DATETIME2,
    is_deleted        BIT            DEFAULT 0,

    CONSTRAINT FK_estimation_customer FOREIGN KEY (customer_id)
        REFERENCES [customer] (customer_id)
);
GO

CREATE TABLE [estimation_item] (
    estimation_item_id INT           IDENTITY(1,1) PRIMARY KEY,
    estimation_id      INT,
    product_id         INT,
    quantity           DECIMAL(18,3),
    created_at         DATETIME2     DEFAULT GETDATE(),
    modified_at        DATETIME2,
    is_deleted         BIT           DEFAULT 0,

    CONSTRAINT FK_estimation_item_estimation FOREIGN KEY (estimation_id)
        REFERENCES [estimation] (estimation_id),
    CONSTRAINT FK_estimation_item_product    FOREIGN KEY (product_id)
        REFERENCES [product] (product_id)
);
GO

CREATE TABLE [sales_order] (
    sales_order_id     INT            IDENTITY(1,1) PRIMARY KEY,
    sales_order_number VARCHAR(50)    NOT NULL UNIQUE,
    customer_id        INT,
    tax_percentage     DECIMAL(10,2),
    remarks            VARCHAR(1000),
    created_at         DATETIME2      DEFAULT GETDATE(),
    modified_at        DATETIME2,
    is_deleted         BIT            DEFAULT 0,

    CONSTRAINT FK_sales_order_customer FOREIGN KEY (customer_id)
        REFERENCES [customer] (customer_id)
);
GO

CREATE TABLE [sales_order_item] (
    sales_order_item_id INT           IDENTITY(1,1) PRIMARY KEY,
    sales_order_id      INT,
    product_id          INT,
    estimation_id       INT,
    estimation_item_id  INT,
    quantity            DECIMAL(18,3),
    unit_price          DECIMAL(10,2),
    created_at          DATETIME2     DEFAULT GETDATE(),
    modified_at         DATETIME2,
    is_deleted          BIT           DEFAULT 0,

    CONSTRAINT FK_so_item_sales_order      FOREIGN KEY (sales_order_id)
        REFERENCES [sales_order] (sales_order_id),
    CONSTRAINT FK_so_item_product          FOREIGN KEY (product_id)
        REFERENCES [product] (product_id),
    CONSTRAINT FK_so_item_estimation       FOREIGN KEY (estimation_id)
        REFERENCES [estimation] (estimation_id),
    CONSTRAINT FK_so_item_estimation_item  FOREIGN KEY (estimation_item_id)
        REFERENCES [estimation_item] (estimation_item_id)
);
GO

CREATE TABLE [sales_invoice] (
    sales_invoice_id INT            IDENTITY(1,1) PRIMARY KEY,
    invoice_number   VARCHAR(50)    NOT NULL UNIQUE,
    sales_order_id   INT,
    customer_id      INT,
    tax_percentage   DECIMAL(10,2),
    remarks          VARCHAR(1000),
    total_amount     DECIMAL(10,2),
    created_at       DATETIME2      DEFAULT GETDATE(),
    modified_at      DATETIME2,
    is_deleted       BIT            DEFAULT 0,

    CONSTRAINT FK_sales_invoice_sales_order FOREIGN KEY (sales_order_id)
        REFERENCES [sales_order] (sales_order_id),
    CONSTRAINT FK_sales_invoice_customer    FOREIGN KEY (customer_id)
        REFERENCES [customer] (customer_id)
);
GO

CREATE TABLE [sales_invoice_item] (
    sales_invoice_item_id INT           IDENTITY(1,1) PRIMARY KEY,
    sales_invoice_id      INT,
    product_id            INT,
    sales_order_id        INT,
    sales_order_item_id   INT,
    quantity              DECIMAL(18,3),
    unit_price            DECIMAL(10,2),
    created_at            DATETIME2     DEFAULT GETDATE(),
    modified_at           DATETIME2,
    is_deleted            BIT           DEFAULT 0,

    CONSTRAINT FK_si_item_sales_invoice    FOREIGN KEY (sales_invoice_id)
        REFERENCES [sales_invoice] (sales_invoice_id),
    CONSTRAINT FK_si_item_product          FOREIGN KEY (product_id)
        REFERENCES [product] (product_id),
    CONSTRAINT FK_si_item_sales_order      FOREIGN KEY (sales_order_id)
        REFERENCES [sales_order] (sales_order_id),
    CONSTRAINT FK_si_item_sales_order_item FOREIGN KEY (sales_order_item_id)
        REFERENCES [sales_order_item] (sales_order_item_id)
);
GO

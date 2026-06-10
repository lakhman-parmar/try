export interface SalesInvoiceFilterDto {
  search?: string;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  pageNumber: number;
  pageSize: number;
}

export interface SalesInvoiceListItemDto {
  salesInvoiceId: number;
  invoiceNumber: string;
  salesOrderId?: number;
  salesOrderNumber?: string;
  customerId?: number;
  customerName?: string;
  taxPercentage?: number;
  remarks?: string;
  totalAmount?: number;
  itemCount: number;
  subTotal?: number;
  createdAt?: string;
}

export interface SalesInvoiceDetailDto extends SalesInvoiceListItemDto {
  modifiedAt?: string;
  items: SalesInvoiceItemDetailDto[];
}

export interface SalesInvoiceItemDetailDto {
  salesInvoiceItemId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  unitPrice?: number;
  salesOrderId?: number;
  salesOrderNumber?: string;
  salesOrderItemId?: number;
}

export interface SalesOrderForInvoiceDto {
  salesOrderId: number;
  salesOrderNumber: string;
  customerId?: number;
  customerName?: string;
  taxPercentage?: number;
  remarks?: string;
  createdAt?: string;
  items: SalesOrderItemForInvoiceDto[];
}

export interface SalesOrderItemForInvoiceDto {
  salesOrderItemId: number;
  salesOrderId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  unitPrice?: number;
  availableStock?: number;
  estimationId?: number;
  estimationNumber?: string;
  estimationItemId?: number;
}

export interface CreateSalesInvoiceDto {
  customerId?: number;
  taxPercentage?: number;
  remarks?: string;
  items: CreateSalesInvoiceItemDto[];
}

export interface CreateSalesInvoiceItemDto {
  productId: number;
  salesOrderId?: number;
  salesOrderItemId?: number;
  quantity: number;
  unitPrice?: number;
}

export interface RegenerateSalesInvoiceDto {
  taxPercentage?: number;
  remarks?: string;
}

export interface InvoiceLineItem {
  productId: number | null;
  productName: string;
  unitShortName: string;
  quantity: number;
  unitPrice?: number;
  availableStock?: number;
  salesOrderId?: number;
  salesOrderNumber?: string;
  salesOrderItemId?: number;
  estimationId?: number;
  estimationNumber?: string;
  estimationItemId?: number;
}

export interface ProductDto {
  productId: number;
  name: string;
  description?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  stock?: number;
  unitShortName?: string;
}

export interface CustomerDto {
  customerId: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

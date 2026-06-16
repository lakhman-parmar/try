export interface SalesReturnFilterDto {
  search?: string;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  pageNumber: number;
  pageSize: number;
}

export interface SalesReturnListItemDto {
  salesReturnId: number;
  returnNumber: string;
  salesInvoiceId?: number;
  invoiceNumber?: string;
  customerId?: number;
  customerName?: string;
  remarks?: string;
  totalAmount?: number;
  itemCount: number;
  subTotal?: number;
  createdAt?: string;
}

export interface SalesReturnDetailDto extends SalesReturnListItemDto {
  modifiedAt?: string;
  items: SalesReturnItemDetailDto[];
}

export interface SalesReturnItemDetailDto {
  salesReturnItemId: number;
  salesInvoiceItemId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  unitPrice?: number;
  salesInvoiceId?: number;
}

export interface SalesInvoiceForReturnDto {
  salesInvoiceId: number;
  invoiceNumber: string;
  customerId?: number;
  customerName?: string;
  remarks?: string;
  createdAt?: string;
  items: SalesInvoiceItemForReturnDto[];
}

export interface SalesInvoiceItemForReturnDto {
  salesInvoiceItemId: number;
  salesInvoiceId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  returnedQuantity: number;
  returnableQuantity: number;
  unitPrice?: number;
}

export interface CreateSalesReturnDto {
  salesInvoiceId?: number;
  customerId?: number;
  remarks?: string;
  items: CreateSalesReturnItemDto[];
}

export interface CreateSalesReturnItemDto {
  productId: number;
  salesInvoiceId: number;
  salesInvoiceItemId: number;
  quantity: number;
  unitPrice?: number;
}

export interface ReturnLineItem {
  productId: number;
  productName: string;
  unitShortName: string;
  invoiceQuantity: number;
  returnedQuantity: number;
  returnableQuantity: number;
  quantity: number;
  unitPrice?: number;
  salesInvoiceId: number;
  invoiceNumber: string;
  salesInvoiceItemId: number;
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

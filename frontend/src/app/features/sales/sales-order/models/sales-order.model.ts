export interface SalesOrderFilterDto {
  search?: string;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  pageNumber: number;
  pageSize: number;
}

export interface SalesOrderListItemDto {
  salesOrderId: number;
  salesOrderNumber: string;
  customerId?: number;
  customerName?: string;
  taxPercentage?: number;
  remarks?: string;
  itemCount: number;
  subTotal?: number;
  createdAt?: string;
}

export interface SalesOrderDetailDto {
  salesOrderId: number;
  salesOrderNumber: string;
  customerId?: number;
  customerName?: string;
  taxPercentage?: number;
  remarks?: string;
  createdAt?: string;
  modifiedAt?: string;
  items: SalesOrderItemDetailDto[];
}

export interface SalesOrderItemDetailDto {
  salesOrderItemId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  unitPrice?: number;
  estimationId?: number;
  estimationNumber?: string;
  estimationItemId?: number;
}

export interface EstimationForSoDto {
  estimationId: number;
  estimationNumber: string;
  remarks?: string;
  createdAt?: string;
  items: EstimationItemForSoDto[];
}

export interface EstimationItemForSoDto {
  estimationItemId: number;
  estimationId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
}

export interface CreateSalesOrderDto {
  customerId?: number;
  taxPercentage?: number;
  remarks?: string;
  items: CreateSalesOrderItemDto[];
}

export interface CreateSalesOrderItemDto {
  productId: number;
  estimationId?: number;
  estimationItemId?: number;
  quantity: number;
}

export interface UpdateSalesOrderDto {
  customerId?: number;
  taxPercentage?: number;
  remarks?: string;
  items: CreateSalesOrderItemDto[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
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

export interface SoLineItem {
  productId: number | null;
  productName: string;
  unitShortName: string;
  quantity: number;
  unitPrice?: number;
  estimationId?: number;
  estimationNumber?: string;
  estimationItemId?: number;
}

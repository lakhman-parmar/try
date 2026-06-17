export interface PurchaseBillFilterDto {
  search?: string;
  fromDate?: string;
  toDate?: string;
  supplierId?: number;
  pageNumber: number;
  pageSize: number;
}

export interface PurchaseBillListItemDto {
  purchaseBillId: number;
  billNumber: string;
  supplierId?: number;
  supplierName?: string;
  taxPercentage?: number;
  totalAmount?: number;
  itemCount: number;
  createdAt?: string;
}

export interface PurchaseBillDetailDto {
  purchaseBillId: number;
  billNumber: string;
  supplierId?: number;
  supplierName?: string;
  taxPercentage?: number;
  totalAmount?: number;
  remarks?: string;
  createdAt?: string;
  modifiedAt?: string;
  items: PurchaseBillItemDetailDto[];
}

export interface PurchaseBillItemDetailDto {
  purchaseBillItemId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  unitPrice?: number;
  purchaseOrderId?: number;
  poNumber?: string;
  purchaseOrderItemId?: number;
  requisitionId?: number;
  requisitionNo?: string;
  requisitionItemId?: number;
}

export interface PurchaseOrderForBillDto {
  purchaseOrderId: number;
  poNumber: string;
  supplierId?: number;
  supplierName?: string;
  taxPercentage?: number;
  remarks?: string;
  createdAt?: string;
  items: PurchaseOrderItemForBillDto[];
}

export interface PurchaseOrderItemForBillDto {
  purchaseOrderItemId: number;
  purchaseOrderId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  unitPrice?: number;
  requisitionId?: number;
  requisitionNo?: string;
  requisitionItemId?: number;
}

export interface CreatePurchaseBillDto {
  supplierId?: number;
  taxPercentage?: number;
  remarks?: string;
  items: CreatePurchaseBillItemDto[];
}

export interface CreatePurchaseBillItemDto {
  productId: number;
  purchaseOrderId?: number;
  purchaseOrderItemId?: number;
  quantity: number;
}

export interface RegeneratePurchaseBillDto {
  taxPercentage?: number;
  remarks?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface BillLineItem {
  productId: number | null;
  productName: string;
  unitShortName: string;
  quantity: number;
  unitPrice?: number;
  purchaseOrderId?: number;
  poNumber?: string;
  purchaseOrderItemId?: number;
  requisitionId?: number;
  requisitionNo?: string;
  requisitionItemId?: number;
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

export interface SupplierDto {
  supplierId: number;
  name: string;
}

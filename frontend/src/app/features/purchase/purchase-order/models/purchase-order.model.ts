export interface PurchaseOrderFilterDto {
  search?: string;
  fromDate?: string;
  toDate?: string;
  supplierId?: number;
  pageNumber: number;
  pageSize: number;
}

export interface PurchaseOrderListItemDto {
  purchaseOrderId: number;
  poNumber: string;
  supplierId?: number;
  supplierName?: string;
  taxPercentage?: number;
  remarks?: string;
  itemCount: number;
  subTotal?: number;
  createdAt?: string;
}

export interface PurchaseOrderDetailDto {
  purchaseOrderId: number;
  poNumber: string;
  supplierId?: number;
  supplierName?: string;
  taxPercentage?: number;
  remarks?: string;
  createdAt?: string;
  modifiedAt?: string;
  items: PurchaseOrderItemDetailDto[];
}

export interface PurchaseOrderItemDetailDto {
  purchaseOrderItemId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  unitPrice?: number;
  requisitionId?: number;
  requisitionNo?: string;
  requisitionItemId?: number;
}

export interface RequisitionForPoDto {
  purchaseRequisitionId: number;
  requisitionNo: string;
  supplierId?: number;
  supplierName?: string;
  remarks?: string;
  createdAt?: string;
  items: RequisitionItemForPoDto[];
}

export interface RequisitionItemForPoDto {
  purchaseRequisitionItemId: number;
  requisitionId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
}

export interface CreatePurchaseOrderDto {
  supplierId?: number;
  taxPercentage?: number;
  remarks?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface CreatePurchaseOrderItemDto {
  productId: number;
  requisitionId?: number;
  requisitionItemId?: number;
  quantity: number;
}

export interface UpdatePurchaseOrderDto {
  supplierId?: number;
  taxPercentage?: number;
  remarks?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface PoLineItem {
  productId: number | null;
  productName: string;
  unitShortName: string;
  quantity: number;
  unitPrice?: number;
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

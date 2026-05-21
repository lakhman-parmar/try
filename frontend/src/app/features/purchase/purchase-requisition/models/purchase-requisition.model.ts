export interface PurchaseRequisitionFilterDto {
    search?: string;
    fromDate?: string;
    toDate?: string;
    pageNumber: number;
    pageSize: number;
  }
  
  export interface PurchaseRequisitionListItemDto {
    purchaseRequisitionId: number;
    requisitionNo: string;
    remarks?: string;
    itemCount: number;
    createdAt?: string;
  }
  
  export interface PurchaseRequisitionDetailDto {
    purchaseRequisitionId: number;
    requisitionNo: string;
    remarks?: string;
    createdAt?: string;
    modifiedAt?: string;
    items: PurchaseRequisitionItemDetailDto[];
  }
  
  export interface PurchaseRequisitionItemDetailDto {
    purchaseRequisitionItemId: number;
    productId: number;
    productName: string;
    unitShortName?: string;
    quantity: number;
  }
  
  export interface CreatePurchaseRequisitionDto {
    remarks?: string;
    items: CreatePurchaseRequisitionItemDto[];
  }
  
  export interface CreatePurchaseRequisitionItemDto {
    productId: number;
    quantity: number;
  }
  
  export interface UpdatePurchaseRequisitionDto {
    remarks?: string;
    items: CreatePurchaseRequisitionItemDto[];
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
  
  // Local UI model for line items in the builder
  export interface RequisitionLineItem {
    productId: number | null;
    productName: string;
    unitShortName: string;
    quantity: number;
  }
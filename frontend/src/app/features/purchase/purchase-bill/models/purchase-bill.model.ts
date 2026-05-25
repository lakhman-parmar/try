// ── Filter / Pagination ───────────────────────────────────────────────────────
export interface PurchaseBillFilterDto {
    search?: string;
    fromDate?: string;
    toDate?: string;
    supplierId?: number;
    pageNumber: number;
    pageSize: number;
  }
  
  // ── List ──────────────────────────────────────────────────────────────────────
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
  
  // ── Detail ────────────────────────────────────────────────────────────────────
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
    // PO traceability
    purchaseOrderId?: number;
    poNumber?: string;
    purchaseOrderItemId?: number;
    // Requisition traceability
    requisitionId?: number;
    requisitionNo?: string;
    requisitionItemId?: number;
  }
  
  // ── Orders available for billing ──────────────────────────────────────────────
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
    // Requisition traceability
    requisitionId?: number;
    requisitionNo?: string;
    requisitionItemId?: number;
  }
  
  // ── Create ────────────────────────────────────────────────────────────────────
  export interface CreatePurchaseBillDto {
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
  
  // ── Regenerate ────────────────────────────────────────────────────────────────
  export interface RegeneratePurchaseBillDto {
    taxPercentage?: number;
    remarks?: string;
  }
  
  // ── Shared ────────────────────────────────────────────────────────────────────
  export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  }
  
  // ── Local UI model for line items in bill builder ─────────────────────────────
  export interface BillLineItem {
    productId: number | null;
    productName: string;
    unitShortName: string;
    quantity: number;
    unitPrice?: number;
    // PO traceability — set when sourced from a PO
    purchaseOrderId?: number;
    poNumber?: string;
    purchaseOrderItemId?: number;
    // Requisition traceability — set when PO item carried it
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
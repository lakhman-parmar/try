export interface PurchaseReturnFilterDto {
    search?: string;
    fromDate?: string;
    toDate?: string;
    supplierId?: number;
    pageNumber: number;
    pageSize: number;
}

export interface PurchaseReturnListItemDto {
    purchaseReturnId: number;
    purchaseReturnNumber: string;
    supplierId?: number;
    supplierName?: string;
    totalAmount?: number;
    itemCount: number;
    createdAt?: string;
}

export interface PurchaseReturnDetailDto {
    purchaseReturnId: number;
    purchaseReturnNumber: string;
    supplierId?: number;
    supplierName?: string;
    totalAmount?: number;
    remarks?: string;
    createdAt?: string;
    modifiedAt?: string;
    items: PurchaseReturnItemDetailDto[];
}

export interface PurchaseReturnItemDetailDto {
    purchaseReturnItemId: number;
    productId: number;
    productName: string;
    unitShortName?: string;
    quantity: number;
    unitPrice?: number;
    purchaseBillId?: number;
    billNumber?: string;
    purchaseBillItemId?: number;
}

export interface BillForReturnDto {
    purchaseBillId: number;
    billNumber: string;
    supplierId?: number;
    supplierName?: string;
    totalAmount?: number;
    createdAt?: string;
    items: BillItemForReturnDto[];
}

export interface BillItemForReturnDto {
    purchaseBillItemId: number;
    purchaseBillId: number;
    productId: number;
    productName: string;
    unitShortName?: string;
    billedQuantity: number;
    returnedQuantity: number;
    remainingQuantity: number;
    unitPrice?: number;
}

export interface CreatePurchaseReturnDto {
    remarks?: string;
    items: CreatePurchaseReturnItemDto[];
}

export interface CreatePurchaseReturnItemDto {
    productId: number;
    purchaseBillId: number;
    purchaseBillItemId: number;
    quantity: number;
    unitPrice?: number;
}

/** Local UI-only type used in the create form line items table */
export interface PurchaseReturnLineItem {
    productId: number;
    productName: string;
    unitShortName: string;
    billedQuantity: number;
    returnedQuantity: number;
    remainingQuantity: number;
    quantity: number;
    unitPrice?: number;
    purchaseBillId: number;
    billNumber: string;
    purchaseBillItemId: number;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}
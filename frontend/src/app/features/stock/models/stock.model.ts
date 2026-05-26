// ── Filter / Pagination ───────────────────────────────────────────────────────
export interface StockFilterDto {
  search?: string;
  pageNumber: number;
  pageSize: number;
}

// ── List ──────────────────────────────────────────────────────────────────────
export interface StockListItemDto {
  productId: number;
  name: string;
  description?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  stock?: number;
  unitShortName?: string;
}

// ── Detail ────────────────────────────────────────────────────────────────────
export interface StockDetailDto {
  productId: number;
  name: string;
  description?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  stock?: number;
  unitShortName?: string;
  movements: StockMovementDto[];
}

export interface StockMovementDto {
  stockRecordId: number;
  recordType: number; // 0 = Sales, 1 = Purchase
  transactionId: number;
  quantityChange?: number;
  price?: number;
  reason?: string;
  createdAt?: string;
}

// ── Shared ────────────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

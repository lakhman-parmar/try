// ── Filter ────────────────────────────────────────────────────────────────────
export interface ProductFilterDto {
  search?: string;
  pageNumber: number;
  pageSize: number;
}

// ── List ──────────────────────────────────────────────────────────────────────
export interface ProductListItemDto {
  productId: number;
  name: string;
  description?: string;
  sellingPrice?: number;
  minPurchasePrice?: number;
  stock?: number;
  unitId?: number;
  unitShortName?: string;
  imageUrl?: string;
  createdAt?: string;
  modifiedAt?: string;
}

// ── Detail ────────────────────────────────────────────────────────────────────
export interface ProductDetailDto {
  productId: number;
  name: string;
  description?: string;
  sellingPrice?: number;
  stock?: number;
  unitId?: number;
  unitShortName?: string;
  imageUrl?: string;
  createdAt?: string;
  modifiedAt?: string;
  suppliers: ProductSupplierDto[];
}

export interface ProductSupplierDto {
  supplierProductId: number;
  supplierId: number;
  supplierName: string;
  purchasePrice?: number;
}

// ── Mutations ────────────────────────────────────────────────────────────────
export interface CreateProductDto {
  name: string;
  description?: string;
  sellingPrice?: number;
  unitId?: number;
  imageUrl?: string;
}

export interface UpdateProductDto {
  name: string;
  description?: string;
  sellingPrice?: number;
  unitId?: number;
  imageUrl?: string;
}

export interface UpsertSupplierProductDto {
  productId: number;
  supplierId: number;
  purchasePrice: number;
}

// ── Unit ──────────────────────────────────────────────────────────────────────
export interface UnitDto {
  unitId: number;
  name: string;
  shortName: string;
}

// ── Supplier (for dropdown) ───────────────────────────────────────────────────
export interface SupplierDto {
  supplierId: number;
  name: string;
}

// ── Paging ────────────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

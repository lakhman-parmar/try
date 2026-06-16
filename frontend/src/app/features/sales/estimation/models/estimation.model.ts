export interface EstimationFilterDto {
  search?: string;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  pageNumber: number;
  pageSize: number;
}

export interface EstimationListItemDto {
  estimationId: number;
  estimationNumber: string;
  customerId?: number;
  customerName?: string;
  remarks?: string;
  itemCount: number;
  createdAt?: string;
  totalAmount: number;
}

export interface EstimationDetailDto {
  estimationId: number;
  estimationNumber: string;
  customerId?: number;
  customerName?: string;
  remarks?: string;
  createdAt?: string;
  modifiedAt?: string;
  totalAmount: number;
  items: EstimationItemDetailDto[];
}

export interface EstimationItemDetailDto {
  estimationItemId: number;
  productId: number;
  productName: string;
  unitShortName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateEstimationDto {
  customerId?: number;
  remarks?: string;
  items: CreateEstimationItemDto[];
}

export interface CreateEstimationItemDto {
  productId: number;
  quantity: number;
  unitPrice?: number;
}

export interface UpdateEstimationDto extends CreateEstimationDto {}

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

export interface EstimationLineItem {
  productId: number | null;
  quantity: number;
  unitPrice?: number | null;
}

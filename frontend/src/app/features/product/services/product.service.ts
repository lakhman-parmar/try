import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateProductDto,
  PagedResult,
  ProductDetailDto,
  ProductFilterDto,
  ProductListItemDto,
  SupplierDto,
  UnitDto,
  UpdateProductDto,
  UpsertSupplierProductDto,
} from '../models/product.model';

interface ApiResponse<T> {
  isSuccess: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];
  // console.error(this.apiUrl);
  private get base() {
    return `${this.apiUrl}/products`;
  }

  getAll(filter: ProductFilterDto) {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    return this.http.get<ApiResponse<PagedResult<ProductListItemDto>>>(`${this.base}/manage`, {
      params,
    });
  }

  getById(id: number) {
    return this.http.get<ApiResponse<ProductDetailDto>>(`${this.base}/manage/${id}`);
  }

  create(dto: CreateProductDto) {
    return this.http.post<ApiResponse<number>>(`${this.base}/manage`, dto);
  }

  update(id: number, dto: UpdateProductDto) {
    return this.http.put<ApiResponse<boolean>>(`${this.base}/manage/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<boolean>>(`${this.base}/manage/${id}`);
  }

  getUnits() {
    return this.http.get<ApiResponse<UnitDto[]>>(`${this.base}/units`);
  }

  getSuppliers() {
    return this.http.get<ApiResponse<SupplierDto[]>>(`${this.base}/suppliers`);
  }

  upsertSupplierProduct(dto: UpsertSupplierProductDto) {
    return this.http.post<ApiResponse<number>>(`${this.base}/suppliers`, dto);
  }

  deleteSupplierProduct(supplierProductId: number) {
    return this.http.delete<ApiResponse<boolean>>(`${this.base}/suppliers/${supplierProductId}`);
  }

  getProductSuppliers(productId: number) {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/${productId}/suppliers`);
  }
}

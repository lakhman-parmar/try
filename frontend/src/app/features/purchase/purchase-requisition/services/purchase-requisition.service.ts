import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
  CreatePurchaseRequisitionDto,
  PagedResult,
  ProductDto,
  SupplierDto,
  PurchaseRequisitionDetailDto,
  PurchaseRequisitionFilterDto,
  PurchaseRequisitionListItemDto,
  UpdatePurchaseRequisitionDto,
} from '../models/purchase-requisition.model.js';

@Injectable({ providedIn: 'root' })
export class PurchaseRequisitionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  getAll(
    filter: PurchaseRequisitionFilterDto,
  ): Observable<ApiResponse<PagedResult<PurchaseRequisitionListItemDto>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    return this.http.get<ApiResponse<PagedResult<PurchaseRequisitionListItemDto>>>(
      `${this.apiUrl}/purchase-requisitions`,
      { params },
    );
  }

  getById(id: number): Observable<ApiResponse<PurchaseRequisitionDetailDto>> {
    return this.http.get<ApiResponse<PurchaseRequisitionDetailDto>>(
      `${this.apiUrl}/purchase-requisitions/${id}`,
    );
  }

  create(dto: CreatePurchaseRequisitionDto): Observable<ApiResponse<{ purchaseRequisitionId: number }>> {
    return this.http.post<ApiResponse<{ purchaseRequisitionId: number }>>(
      `${this.apiUrl}/purchase-requisitions`,
      dto,
    );
  }

  update(id: number, dto: UpdatePurchaseRequisitionDto): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(
      `${this.apiUrl}/purchase-requisitions/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(
      `${this.apiUrl}/purchase-requisitions/${id}`,
    );
  }

  getProducts(supplierId?: number): Observable<ApiResponse<ProductDto[]>> {
    const params = supplierId ? new HttpParams().set('supplierId', supplierId) : undefined;
    return this.http.get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/products`, { params });
  }

  getSuppliers(): Observable<ApiResponse<SupplierDto[]>> {
    return this.http.get<ApiResponse<SupplierDto[]>>(`${this.apiUrl}/products/suppliers`);
  }
}

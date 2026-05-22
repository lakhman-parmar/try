import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
  CreatePurchaseOrderDto,
  PagedResult,
  ProductDto,
  PurchaseOrderDetailDto,
  PurchaseOrderFilterDto,
  PurchaseOrderListItemDto,
  RequisitionForPoDto,
  UpdatePurchaseOrderDto,
} from '../models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  getAll(
    filter: PurchaseOrderFilterDto,
  ): Observable<ApiResponse<PagedResult<PurchaseOrderListItemDto>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.supplierId) params = params.set('supplierId', filter.supplierId);
    return this.http.get<ApiResponse<PagedResult<PurchaseOrderListItemDto>>>(
      `${this.apiUrl}/purchase-orders`,
      { params },
    );
  }

  getById(id: number): Observable<ApiResponse<PurchaseOrderDetailDto>> {
    return this.http.get<ApiResponse<PurchaseOrderDetailDto>>(
      `${this.apiUrl}/purchase-orders/${id}`,
    );
  }

  getRequisitionsForPo(): Observable<ApiResponse<RequisitionForPoDto[]>> {
    return this.http.get<ApiResponse<RequisitionForPoDto[]>>(
      `${this.apiUrl}/purchase-orders/requisitions-for-po`,
    );
  }

  getProducts(): Observable<ApiResponse<ProductDto[]>> {
    return this.http.get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/products`);
  }

  create(dto: CreatePurchaseOrderDto): Observable<ApiResponse<{ purchaseOrderId: number }>> {
    return this.http.post<ApiResponse<{ purchaseOrderId: number }>>(
      `${this.apiUrl}/purchase-orders`,
      dto,
    );
  }

  update(id: number, dto: UpdatePurchaseOrderDto): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(
      `${this.apiUrl}/purchase-orders/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(
      `${this.apiUrl}/purchase-orders/${id}`,
    );
  }
}

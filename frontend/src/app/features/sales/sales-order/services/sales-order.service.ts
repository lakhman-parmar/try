import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
  CreateSalesOrderDto,
  CustomerDto,
  EstimationForSoDto,
  PagedResult,
  ProductDto,
  SalesOrderDetailDto,
  SalesOrderFilterDto,
  SalesOrderListItemDto,
  UpdateSalesOrderDto,
} from '../models/sales-order.model';

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  getAll(filter: SalesOrderFilterDto): Observable<ApiResponse<PagedResult<SalesOrderListItemDto>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.customerId) params = params.set('customerId', filter.customerId);

    return this.http.get<ApiResponse<PagedResult<SalesOrderListItemDto>>>(
      `${this.apiUrl}/sales-orders`,
      { params },
    );
  }

  getById(id: number): Observable<ApiResponse<SalesOrderDetailDto>> {
    return this.http.get<ApiResponse<SalesOrderDetailDto>>(`${this.apiUrl}/sales-orders/${id}`);
  }

  getEstimationsForSo(customerId: number): Observable<ApiResponse<EstimationForSoDto[]>> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.get<ApiResponse<EstimationForSoDto[]>>(
      `${this.apiUrl}/sales-orders/estimations-for-so`,
      { params },
    );
  }

  getProducts(): Observable<ApiResponse<ProductDto[]>> {
    return this.http.get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/products`);
  }

  getCustomers(): Observable<ApiResponse<CustomerDto[]>> {
    return this.http.get<ApiResponse<CustomerDto[]>>(`${this.apiUrl}/customers`);
  }

  create(dto: CreateSalesOrderDto): Observable<ApiResponse<{ salesOrderId: number }>> {
    return this.http.post<ApiResponse<{ salesOrderId: number }>>(
      `${this.apiUrl}/sales-orders`,
      dto,
    );
  }

  update(id: number, dto: UpdateSalesOrderDto): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/sales-orders/${id}`, dto);
  }

  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/sales-orders/${id}`);
  }
}

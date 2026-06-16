import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
  CreateSalesReturnDto,
  CustomerDto,
  PagedResult,
  SalesInvoiceForReturnDto,
  SalesReturnDetailDto,
  SalesReturnFilterDto,
  SalesReturnListItemDto,
} from '../models/sales-return.model';

@Injectable({ providedIn: 'root' })
export class SalesReturnService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  getAll(
    filter: SalesReturnFilterDto,
  ): Observable<ApiResponse<PagedResult<SalesReturnListItemDto>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.customerId) params = params.set('customerId', filter.customerId);
    return this.http.get<ApiResponse<PagedResult<SalesReturnListItemDto>>>(
      `${this.apiUrl}/sales-returns`,
      { params },
    );
  }

  getById(id: number): Observable<ApiResponse<SalesReturnDetailDto>> {
    return this.http.get<ApiResponse<SalesReturnDetailDto>>(`${this.apiUrl}/sales-returns/${id}`);
  }

  getCustomers(): Observable<ApiResponse<CustomerDto[]>> {
    return this.http.get<ApiResponse<CustomerDto[]>>(`${this.apiUrl}/customers`);
  }

  getInvoicesForReturn(
    customerId?: number | null,
    pageNumber = 1,
    pageSize = 20,
  ): Observable<ApiResponse<PagedResult<SalesInvoiceForReturnDto>>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (customerId) params = params.set('customerId', customerId);
    return this.http.get<ApiResponse<PagedResult<SalesInvoiceForReturnDto>>>(
      `${this.apiUrl}/sales-returns/invoices-for-return`,
      { params },
    );
  }

  create(dto: CreateSalesReturnDto): Observable<ApiResponse<{ salesReturnId: number }>> {
    return this.http.post<ApiResponse<{ salesReturnId: number }>>(
      `${this.apiUrl}/sales-returns`,
      dto,
    );
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
  CreateSalesInvoiceDto,
  CustomerDto,
  PagedResult,
  ProductDto,
  RegenerateSalesInvoiceDto,
  SalesInvoiceDetailDto,
  SalesInvoiceFilterDto,
  SalesInvoiceListItemDto,
  SalesOrderForInvoiceDto,
} from '../models/sales-invoice.model';

@Injectable({ providedIn: 'root' })
export class SalesInvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  getAll(
    filter: SalesInvoiceFilterDto,
  ): Observable<ApiResponse<PagedResult<SalesInvoiceListItemDto>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.customerId) params = params.set('customerId', filter.customerId);
    return this.http.get<ApiResponse<PagedResult<SalesInvoiceListItemDto>>>(
      `${this.apiUrl}/sales-invoices`,
      { params },
    );
  }

  getById(id: number): Observable<ApiResponse<SalesInvoiceDetailDto>> {
    return this.http.get<ApiResponse<SalesInvoiceDetailDto>>(`${this.apiUrl}/sales-invoices/${id}`);
  }

  getOrdersForInvoice(customerId: number): Observable<ApiResponse<SalesOrderForInvoiceDto[]>> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.get<ApiResponse<SalesOrderForInvoiceDto[]>>(
      `${this.apiUrl}/sales-invoices/orders-for-invoice`,
      { params },
    );
  }

  getCustomers(): Observable<ApiResponse<CustomerDto[]>> {
    return this.http.get<ApiResponse<CustomerDto[]>>(`${this.apiUrl}/customers`);
  }

  getProducts(): Observable<ApiResponse<ProductDto[]>> {
    return this.http.get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/products`);
  }

  create(dto: CreateSalesInvoiceDto): Observable<ApiResponse<{ salesInvoiceId: number }>> {
    return this.http.post<ApiResponse<{ salesInvoiceId: number }>>(
      `${this.apiUrl}/sales-invoices`,
      dto,
    );
  }

  regenerate(
    id: number,
    dto: RegenerateSalesInvoiceDto,
  ): Observable<ApiResponse<{ salesInvoiceId: number }>> {
    return this.http.post<ApiResponse<{ salesInvoiceId: number }>>(
      `${this.apiUrl}/sales-invoices/${id}/regenerate`,
      dto,
    );
  }

  downloadPdf(id: number): void {
    this.http.get(`${this.apiUrl}/sales-invoices/${id}/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }
}

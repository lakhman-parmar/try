import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
  CreatePurchaseBillDto,
  PagedResult,
  ProductDto,
  PurchaseBillDetailDto,
  PurchaseBillFilterDto,
  PurchaseBillListItemDto,
  PurchaseOrderForBillDto,
  RegeneratePurchaseBillDto,
  SupplierDto,
} from '../models/purchase-bill.model';

@Injectable({ providedIn: 'root' })
export class PurchaseBillService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  getAll(
    filter: PurchaseBillFilterDto,
  ): Observable<ApiResponse<PagedResult<PurchaseBillListItemDto>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.supplierId) params = params.set('supplierId', filter.supplierId);
    return this.http.get<ApiResponse<PagedResult<PurchaseBillListItemDto>>>(
      `${this.apiUrl}/purchase-bills`,
      { params },
    );
  }

  getById(id: number): Observable<ApiResponse<PurchaseBillDetailDto>> {
    return this.http.get<ApiResponse<PurchaseBillDetailDto>>(`${this.apiUrl}/purchase-bills/${id}`);
  }

  getOrdersForBill(
    supplierId: number,
    pageNumber: number = 1,
    pageSize: number = 20,
  ): Observable<ApiResponse<PagedResult<PurchaseOrderForBillDto>>> {
    let params = new HttpParams()
      .set('supplierId', supplierId)
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    return this.http.get<ApiResponse<PagedResult<PurchaseOrderForBillDto>>>(
      `${this.apiUrl}/purchase-bills/orders-for-bill`,
      { params },
    );
  }

  getProducts(supplierId?: number): Observable<ApiResponse<ProductDto[]>> {
    const params = supplierId ? new HttpParams().set('supplierId', supplierId) : undefined;
    return this.http.get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/products`, { params });
  }

  getSuppliers(): Observable<ApiResponse<SupplierDto[]>> {
    return this.http.get<ApiResponse<SupplierDto[]>>(`${this.apiUrl}/products/suppliers`);
  }

  create(dto: CreatePurchaseBillDto): Observable<ApiResponse<{ purchaseBillId: number }>> {
    return this.http.post<ApiResponse<{ purchaseBillId: number }>>(
      `${this.apiUrl}/purchase-bills`,
      dto,
    );
  }

  regenerate(
    id: number,
    dto: RegeneratePurchaseBillDto,
  ): Observable<ApiResponse<{ purchaseBillId: number }>> {
    return this.http.post<ApiResponse<{ purchaseBillId: number }>>(
      `${this.apiUrl}/purchase-bills/${id}/regenerate`,
      dto,
    );
  }

  downloadPdf(id: number): void {
    this.http.get(`${this.apiUrl}/purchase-bills/${id}/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
    BillForReturnDto,
    CreatePurchaseReturnDto,
    PagedResult,
    PurchaseReturnDetailDto,
    PurchaseReturnFilterDto,
    PurchaseReturnListItemDto,
} from '../models/purchase-return.model';

@Injectable({ providedIn: 'root' })
export class PurchaseReturnService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

    getAll(
        filter: PurchaseReturnFilterDto,
    ): Observable<ApiResponse<PagedResult<PurchaseReturnListItemDto>>> {
        let params = new HttpParams()
            .set('pageNumber', filter.pageNumber)
            .set('pageSize', filter.pageSize);
        if (filter.search) params = params.set('search', filter.search);
        if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
        if (filter.toDate) params = params.set('toDate', filter.toDate);
        if (filter.supplierId) params = params.set('supplierId', filter.supplierId);
        return this.http.get<ApiResponse<PagedResult<PurchaseReturnListItemDto>>>(
            `${this.apiUrl}/purchase-returns`,
            { params },
        );
    }

    getById(id: number): Observable<ApiResponse<PurchaseReturnDetailDto>> {
        return this.http.get<ApiResponse<PurchaseReturnDetailDto>>(
            `${this.apiUrl}/purchase-returns/${id}`,
        );
    }

    getBillsForReturn(): Observable<ApiResponse<BillForReturnDto[]>> {
        return this.http.get<ApiResponse<BillForReturnDto[]>>(
            `${this.apiUrl}/purchase-returns/bills-for-return`,
        );
    }

    create(dto: CreatePurchaseReturnDto): Observable<ApiResponse<{ purchaseReturnId: number }>> {
        return this.http.post<ApiResponse<{ purchaseReturnId: number }>>(
            `${this.apiUrl}/purchase-returns`,
            dto,
        );
    }
}
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
  CreateEstimationDto,
  CustomerDto,
  EstimationDetailDto,
  EstimationFilterDto,
  EstimationListItemDto,
  PagedResult,
  ProductDto,
  UpdateEstimationDto,
} from '../models/estimation.model';

@Injectable({ providedIn: 'root' })
export class EstimationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  getAll(filter: EstimationFilterDto): Observable<ApiResponse<PagedResult<EstimationListItemDto>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);

    if (filter.search) params = params.set('search', filter.search);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.customerId) params = params.set('customerId', filter.customerId);

    return this.http.get<ApiResponse<PagedResult<EstimationListItemDto>>>(
      `${this.apiUrl}/estimations`,
      { params },
    );
  }

  getById(id: number): Observable<ApiResponse<EstimationDetailDto>> {
    return this.http.get<ApiResponse<EstimationDetailDto>>(`${this.apiUrl}/estimations/${id}`);
  }

  create(dto: CreateEstimationDto): Observable<ApiResponse<{ estimationId: number }>> {
    return this.http.post<ApiResponse<{ estimationId: number }>>(`${this.apiUrl}/estimations`, dto);
  }

  update(id: number, dto: UpdateEstimationDto): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/estimations/${id}`, dto);
  }

  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/estimations/${id}`);
  }

  getProducts(): Observable<ApiResponse<ProductDto[]>> {
    return this.http.get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/products`);
  }

  getCustomers(): Observable<ApiResponse<CustomerDto[]>> {
    return this.http.get<ApiResponse<CustomerDto[]>>(`${this.apiUrl}/customers`);
  }
}

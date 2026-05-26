import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  PagedResult,
  StockDetailDto,
  StockFilterDto,
  StockListItemDto,
} from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = import.meta.env['NG_APP_API_URL'];

  getAll(filter: StockFilterDto): Observable<ApiResponse<PagedResult<StockListItemDto>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search) params = params.set('search', filter.search);
    return this.http.get<ApiResponse<PagedResult<StockListItemDto>>>(`${this.apiUrl}/stock`, {
      params,
    });
  }

  getById(productId: number): Observable<ApiResponse<StockDetailDto>> {
    return this.http.get<ApiResponse<StockDetailDto>>(`${this.apiUrl}/stock/${productId}`);
  }
}

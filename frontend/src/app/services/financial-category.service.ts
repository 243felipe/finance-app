import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { FinancialCategory } from '../models/financial-category';

@Injectable({
  providedIn: 'root'
})
export class FinancialCategoryService {
  private readonly baseUrl = `${environment.apiUrl}/categorias-financeiras`;

  constructor(private http: HttpClient) {}

  list(): Observable<FinancialCategory[]> {
    return this.http.get<FinancialCategory[]>(this.baseUrl);
  }

  create(payload: Omit<FinancialCategory, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<FinancialCategory> {
    return this.http.post<FinancialCategory>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<FinancialCategory, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<FinancialCategory> {
    return this.http.put<FinancialCategory>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}


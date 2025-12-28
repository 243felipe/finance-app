import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { FonteRenda } from '../models/fonte-renda';

@Injectable({
  providedIn: 'root'
})
export class FonteRendaService {
  private readonly baseUrl = `${environment.apiUrl}/fontes-renda`;

  constructor(private http: HttpClient) {}

  list(): Observable<FonteRenda[]> {
    return this.http.get<FonteRenda[]>(this.baseUrl);
  }

  create(payload: Omit<FonteRenda, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<FonteRenda> {
    return this.http.post<FonteRenda>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<FonteRenda, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<FonteRenda> {
    return this.http.put<FonteRenda>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}


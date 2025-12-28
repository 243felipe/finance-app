import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { FormaPagamento } from '../models/forma-pagamento';

@Injectable({
  providedIn: 'root'
})
export class FormaPagamentoService {
  private readonly baseUrl = `${environment.apiUrl}/formas-pagamento`;

  constructor(private http: HttpClient) {}

  list(): Observable<FormaPagamento[]> {
    return this.http.get<FormaPagamento[]>(this.baseUrl);
  }

  create(payload: Omit<FormaPagamento, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<FormaPagamento> {
    return this.http.post<FormaPagamento>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<FormaPagamento, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<FormaPagamento> {
    return this.http.put<FormaPagamento>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}


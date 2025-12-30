import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { LancamentoRecorrente } from '../models/lancamento-recorrente';

@Injectable({
  providedIn: 'root'
})
export class LancamentoRecorrenteService {
  private readonly baseUrl = `${environment.apiUrl}/lancamentos-recorrentes`;

  constructor(private http: HttpClient) {}

  listEntradas(): Observable<LancamentoRecorrente[]> {
    return this.http.get<LancamentoRecorrente[]>(`${this.baseUrl}/entradas`);
  }

  listSaidas(): Observable<LancamentoRecorrente[]> {
    return this.http.get<LancamentoRecorrente[]>(`${this.baseUrl}/saidas`);
  }

  create(payload: Omit<LancamentoRecorrente, 'idRecorrente' | 'criadoEm' | 'atualizadoEm'>): Observable<LancamentoRecorrente> {
    return this.http.post<LancamentoRecorrente>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<LancamentoRecorrente, 'idRecorrente' | 'criadoEm' | 'atualizadoEm'>): Observable<LancamentoRecorrente> {
    return this.http.put<LancamentoRecorrente>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}


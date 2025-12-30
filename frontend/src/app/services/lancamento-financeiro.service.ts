import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { LancamentoFinanceiro } from '../models/lancamento-financeiro';

@Injectable({
  providedIn: 'root'
})
export class LancamentoFinanceiroService {
  private readonly baseUrl = `${environment.apiUrl}/lancamentos`;

  constructor(private http: HttpClient) {}

  list(): Observable<LancamentoFinanceiro[]> {
    return this.http.get<LancamentoFinanceiro[]>(this.baseUrl);
  }

  create(payload: Omit<LancamentoFinanceiro, 'id' | 'criadoEm' | 'atualizadoEm' | 'categoria' | 'fonteRenda' | 'contaFixa' | 'formaPagamento'>): Observable<LancamentoFinanceiro> {
    return this.http.post<LancamentoFinanceiro>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<LancamentoFinanceiro, 'id' | 'criadoEm' | 'atualizadoEm' | 'categoria' | 'fonteRenda' | 'contaFixa' | 'formaPagamento'>): Observable<LancamentoFinanceiro> {
    return this.http.put<LancamentoFinanceiro>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listByDateRange(params: {
    dataInicio?: string;
    dataFim?: string;
    tipo?: string;
    idContaFixa?: number;
    idFonteRenda?: number;
  }): Observable<LancamentoFinanceiro[]> {
    const queryParams = new URLSearchParams();
    if (params.dataInicio) queryParams.append('dataInicio', params.dataInicio);
    if (params.dataFim) queryParams.append('dataFim', params.dataFim);
    if (params.tipo) queryParams.append('tipo', params.tipo);
    if (params.idContaFixa) queryParams.append('idContaFixa', params.idContaFixa.toString());
    if (params.idFonteRenda) queryParams.append('idFonteRenda', params.idFonteRenda.toString());
    
    return this.http.get<LancamentoFinanceiro[]>(`${this.baseUrl}/filtro?${queryParams.toString()}`);
  }
}


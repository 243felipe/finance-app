import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface DashboardCards {
  totalEstoque: number;
  totalEntradasMes: number;
  totalSaidasMes: number;
  totalRecorrentesEntradas: number;
  totalContasFixas: number;
  totalPagamentosContaFixaMes: number;
}

export interface DashboardCharts {
  evolucaoMensal: {
    labels: string[];
    entradas: number[];
    saidas: number[];
  };
  distribuicaoCategorias: {
    labels: string[];
    values: number[];
  };
  receitaDespesa: {
    labels: string[];
    receita: number[];
    despesa: number[];
  };
}

export interface LancamentoSaida {
  dataLancamento: string;
  descricao: string;
  valor: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getCards(): Observable<DashboardCards> {
    return this.http.get<DashboardCards>(`${this.baseUrl}/cards`);
  }

  getCharts(): Observable<DashboardCharts> {
    return this.http.get<DashboardCharts>(`${this.baseUrl}/charts`);
  }

  getLancamentosSaidasMes(): Observable<LancamentoSaida[]> {
    return this.http.get<LancamentoSaida[]>(`${this.baseUrl}/lancamentos-saidas-mes`);
  }
}


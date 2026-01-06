import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EstoqueMovimentacao {
  id: number;
  idProduto: number;
  tipo: string;
  quantidade: number;
  valor: number;
  observacao?: string;
  dataMovimentacao: string;
  produto?: string | null;
}

export interface EstoqueMovimentacaoPayload {
  idProduto: number;
  tipo: string;
  quantidade: number;
  valor: number;
  observacao?: string;
}

@Injectable({ providedIn: 'root' })
export class EstoqueMovimentacaoService {
  private baseUrl = environment.apiUrl || '';

  constructor(private http: HttpClient) {}

  listar(): Observable<EstoqueMovimentacao[]> {
    return this.http.get<EstoqueMovimentacao[]>(`${this.baseUrl}/estoque-movimentacoes`);
  }

  criar(payload: EstoqueMovimentacaoPayload): Observable<EstoqueMovimentacao> {
    return this.http.post<EstoqueMovimentacao>(`${this.baseUrl}/estoque-movimentacoes`, payload);
  }

  atualizar(id: number, payload: EstoqueMovimentacaoPayload): Observable<EstoqueMovimentacao> {
    return this.http.put<EstoqueMovimentacao>(`${this.baseUrl}/estoque-movimentacoes/${id}`, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/estoque-movimentacoes/${id}`);
  }

  ultimoValor(idProduto: number): Observable<{ valor: number }> {
    return this.http.get<{ valor: number }>(`${this.baseUrl}/estoque-movimentacoes/ultimo-valor/${idProduto}`);
  }

  saldo(idProduto: number): Observable<{ quantidade: number }> {
    return this.http.get<{ quantidade: number }>(`${this.baseUrl}/estoque/saldo/${idProduto}`);
  }
}


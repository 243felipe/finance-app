import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LancamentoServicoItemPayload {
  idProduto: number;
  quantidade: number;
  valor: number;
}

export interface LancamentoServicoPayload {
  descricao: string;
  observacao?: string;
  itens: LancamentoServicoItemPayload[];
}

export interface LancamentoServico {
  id: number;
  descricao: string;
  observacao?: string;
  dataLancamento: string;
  itens?: Array<{
    id: number;
    idProduto: number;
    quantidade: number;
    valor: number;
    produto?: string | null;
  }>;
}

@Injectable({ providedIn: 'root' })
export class LancamentoServicoService {
  private baseUrl = environment.apiUrl || '';

  constructor(private http: HttpClient) {}

  listar(): Observable<LancamentoServico[]> {
    return this.http.get<LancamentoServico[]>(`${this.baseUrl}/lancamentos-servicos`);
  }

  criar(payload: LancamentoServicoPayload): Observable<LancamentoServico> {
    return this.http.post<LancamentoServico>(`${this.baseUrl}/lancamentos-servicos`, payload);
  }

  obter(id: number): Observable<LancamentoServico> {
    return this.http.get<LancamentoServico>(`${this.baseUrl}/lancamentos-servicos/${id}`);
  }

  atualizar(id: number, payload: LancamentoServicoPayload): Observable<LancamentoServico> {
    return this.http.put<LancamentoServico>(`${this.baseUrl}/lancamentos-servicos/${id}`, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/lancamentos-servicos/${id}`);
  }
}


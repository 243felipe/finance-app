import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  idCategoria?: number | null;
  unidade: string;
  ativo: boolean;
  dataCadastro: string;
  dataAtualiza: string;
  categoria?: string | null;
}

export interface ProdutoPayload {
  nome: string;
  descricao?: string;
  idCategoria?: number | null;
  unidade: string;
  ativo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private baseUrl = environment.apiUrl || '';

  constructor(private http: HttpClient) {}

  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.baseUrl}/products`);
  }

  listarComEntrada(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.baseUrl}/products/com-entrada`);
  }

  obter(id: number): Observable<Produto> {
    return this.http.get<Produto>(`${this.baseUrl}/products/${id}`);
  }

  criar(payload: ProdutoPayload): Observable<Produto> {
    return this.http.post<Produto>(`${this.baseUrl}/products`, payload);
  }

  atualizar(id: number, payload: ProdutoPayload): Observable<Produto> {
    return this.http.put<Produto>(`${this.baseUrl}/products/${id}`, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }
}


import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Categoria {
  id: number;
  nome: string;
  ativo: boolean;
  dataCadastro: string;
}

export interface CategoriaPayload {
  nome: string;
  ativo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private baseUrl = environment.apiUrl || '';

  constructor(private http: HttpClient) {}

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

  criar(payload: CategoriaPayload): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.baseUrl}/categorias`, payload);
  }

  atualizar(id: number, payload: CategoriaPayload): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/categorias/${id}`, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categorias/${id}`);
  }
}


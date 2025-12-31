import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ListaCompras, ItemListaCompras } from '../models/lista-compras';

@Injectable({
  providedIn: 'root'
})
export class ListaComprasService {
  private readonly baseUrl = `${environment.apiUrl}/lista-compras`;

  constructor(private http: HttpClient) {}

  list(): Observable<ListaCompras[]> {
    return this.http.get<ListaCompras[]>(this.baseUrl);
  }

  get(id: number): Observable<ListaCompras> {
    return this.http.get<ListaCompras>(`${this.baseUrl}/${id}`);
  }

  create(payload: Omit<ListaCompras, 'id' | 'data'>): Observable<ListaCompras> {
    return this.http.post<ListaCompras>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<ListaCompras, 'id' | 'data'>): Observable<ListaCompras> {
    return this.http.put<ListaCompras>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  createComItens(payload: { nome: string; itens: Array<{ descricao: string; valor: number }> }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/com-itens`, payload);
  }
}

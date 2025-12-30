import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ItemListaCompras } from '../models/lista-compras';

@Injectable({
  providedIn: 'root'
})
export class ItemListaComprasService {
  private readonly baseUrl = `${environment.apiUrl}/item-lista-compras`;

  constructor(private http: HttpClient) {}

  list(listaId?: number): Observable<ItemListaCompras[]> {
    let params = new HttpParams();
    if (listaId) {
      params = params.set('listaId', listaId.toString());
    }
    return this.http.get<ItemListaCompras[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<ItemListaCompras> {
    return this.http.get<ItemListaCompras>(`${this.baseUrl}/${id}`);
  }

  create(payload: Omit<ItemListaCompras, 'id'>): Observable<ItemListaCompras> {
    return this.http.post<ItemListaCompras>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<ItemListaCompras, 'id' | 'listaComprasId'>): Observable<ItemListaCompras> {
    return this.http.put<ItemListaCompras>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}


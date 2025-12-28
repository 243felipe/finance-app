import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { FixedAccount } from '../models/fixed-account';

@Injectable({
  providedIn: 'root'
})
export class FixedAccountService {
  private readonly baseUrl = `${environment.apiUrl}/contas-fixas`;

  constructor(private http: HttpClient) {}

  list(): Observable<FixedAccount[]> {
    return this.http.get<FixedAccount[]>(this.baseUrl);
  }

  create(payload: Omit<FixedAccount, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<FixedAccount> {
    return this.http.post<FixedAccount>(this.baseUrl, payload);
  }

  update(id: number, payload: Omit<FixedAccount, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<FixedAccount> {
    return this.http.put<FixedAccount>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  total(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.baseUrl}/total`);
  }
}


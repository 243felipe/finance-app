import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly loginKey = 'auth_login';
  private readonly nameKey = 'auth_name';

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(this.tokenKey, res.token);
          if (res?.name) {
            localStorage.setItem(this.nameKey, res.name);
          }
          // Mantém loginKey para compatibilidade, mas prioriza name
          if (payload.login) {
            localStorage.setItem(this.loginKey, payload.login);
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.loginKey);
    localStorage.removeItem(this.nameKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getLogin(): string | null {
    return localStorage.getItem(this.loginKey);
  }

  getName(): string | null {
    return localStorage.getItem(this.nameKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}













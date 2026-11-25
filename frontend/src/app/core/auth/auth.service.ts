import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/teampilot.models';

export interface RegisterRequest {
  login: string;
  senha: string;
  role: 'ROLE_SUPERVISOR' | 'ROLE_RCA';
  codigoRca?: string;
  nomeRca?: string;
  telefoneRca?: string;
  metaMensal?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:8080/api/auth';
  private readonly tokenKey = 'teampilot_token';

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(this.tokenKey));

  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly currentUser = computed(() => {
    const token = this.tokenSignal();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub as string;
    } catch {
      return null;
    }
  });

  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.tokenSignal.set(res.token);
      })
    );
  }

  register(payload: RegisterRequest) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, payload);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.tokenSignal.set(null);
    this.router.navigate(['/login']);
  }
}

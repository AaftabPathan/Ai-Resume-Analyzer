import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'recruiter' | 'admin';
  avatarUrl?: string;
}

interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000/api/auth';

  // Reactive user signal
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userRole = computed(() => this.currentUser()?.role || null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(tap((res) => this.handleAuthentication(res)));
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((res) => this.handleAuthentication(res)));
  }

  oauthLogin(
    provider: string,
    mockData: { email: string; name: string; avatarUrl?: string },
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/oauth`, { provider, ...mockData })
      .pipe(tap((res) => this.handleAuthentication(res)));
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private handleAuthentication(res: AuthResponse): void {
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('current_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }
}

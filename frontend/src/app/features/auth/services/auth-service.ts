import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { AuthData } from '../models/auth';
import { AuthUser, AdminProfile } from '../models/user';

interface JwtPayload {
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string;
  exp: number;
  iss: string;
  aud: string;
}

@Injectable({
  providedIn: 'root',
})
export class CommonAuthService {
  apiUrl = import.meta.env['NG_APP_API_URL'];
  isInitialized = signal(false);
  private accessToken = signal<string | null>(null);
  isLoggedIn = computed(() => this.accessToken() !== null);
  private router = inject(Router);
  private http = inject(HttpClient);
  readonly user = signal<AuthUser | null>(null);

  decodedJwt = computed(() => {
    const token = this.accessToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  });

  role = computed(
    () =>
      this.decodedJwt()?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null,
  );

  userId = computed(
    () =>
      this.decodedJwt()?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      null,
  );

  userEmail = computed(
    () =>
      this.decodedJwt()?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
      null,
  );
  getUserFromToken(): AuthUser | null {
    const token = this.accessToken();
    if (!token) return null;

    try {
      const payload = jwtDecode<JwtPayload>(token);

      const email =
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? '';

      const id = Number(
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? 0,
      );

      const name = this.user()?.name ?? '';

      if (!email) return null;

      const authUser: AuthUser = { id, name, email };
      this.user.set(authUser);
      return authUser;
    } catch {
      return null;
    }
  }

  admin_login(email: string, password: string): Observable<ApiResponse<AuthData>> {
    return this.http
      .post<ApiResponse<AuthData>>(`${this.apiUrl}/adminAuth/login`, { email, password })
      .pipe(
        tap((res) => {
          if (res.isSuccess) {
            this.accessToken.set(res.data.token);
          }
        }),
        catchError((err) => {
          // HTTP error (400, 401, 500, etc.) — let caller handle it
          return throwError(() => err);
        }),
      );
  }

  getAdminProfile(): Observable<ApiResponse<AdminProfile>> {
    return this.http.get<ApiResponse<AdminProfile>>(`${this.apiUrl}/adminAuth/profile`).pipe(
      tap((res) => {
        if (res.isSuccess && res.data) {
          this.user.set({
            id: res.data.adminId,
            name: res.data.name,
            email: res.data.email,
          });
        }
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  //  After (correct - matches pattern of all other endpoints)
  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/adminAuth/logout`, {}).pipe(
      tap(() => {
        const myrole = this.role();
        this.accessToken.set(null);
        this.user.set(null);
        if (myrole == 'Admin') {
          this.router.createUrlTree(['/admin/login']);
        } else {
          this.router.createUrlTree(['/customer/home']);
        }
      }),
      catchError((err) => {
        this.accessToken.set(null); // clear locally even if server errors
        this.user.set(null);
        return throwError(() => err);
      }),
    );
  }

  refresh(): Observable<ApiResponse<AuthData>> {
    return this.http.post<ApiResponse<AuthData>>(`${this.apiUrl}/adminAuth/refresh`, {}).pipe(
      tap((res) => {
        if (res.isSuccess) {
          this.accessToken.set(res.data.token);
          this.getUserFromToken();
          // if (this.role() == 'Admin') {
          //   this.router.navigate(['/admin/dashboard']);
          // } else {
          //   this.router.navigate(['/customer/home']);
          // }
        }
      }),
      catchError((err) => throwError(() => err)),
      finalize(() => this.isInitialized.set(true)),
    );
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  setAuthUser(user: AuthUser) {
    this.user.set(user);
  }

  clearAuthUser() {
    this.user.set(null);
  }
  setToken(token: string) {
    this.accessToken.set(token);
    this.getUserFromToken();
  }
}

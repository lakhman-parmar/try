import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { CommonAuthService } from '../../features/auth/services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(CommonAuthService);

  const router = inject(Router);

  const token = authService.getAccessToken();

  const authReq = req.clone({
    withCredentials: true,
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });

  const ignoreRefresh: string[] = ['refresh', 'adminAuth/login'];

  return next(authReq).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        if (ignoreRefresh.some((url) => req.url.includes(url))) {
          return throwError(() => err);
        }

        const refreshCall = authService.refresh();

        return refreshCall.pipe(
          switchMap(() => {
            const newToken = authService.getAccessToken();

            const retryReq = req.clone({
              withCredentials: true,
              ...(newToken ? { setHeaders: { Authorization: `Bearer ${newToken}` } } : {}),
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            const loginRoute = '';
            router.navigate([loginRoute]);
            return throwError(() => refreshErr);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};

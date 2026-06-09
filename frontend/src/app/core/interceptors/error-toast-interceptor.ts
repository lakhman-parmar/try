import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

interface ApiErrorBody {
  message?: string;
  errors?: string[];
}

export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !req.url.includes('/adminAuth/refresh')) {
        toastService.error(getErrorMessage(error));
      }

      return throwError(() => error);
    }),
  );
};

function getErrorMessage(error: HttpErrorResponse): string {
  const body = error.error as ApiErrorBody | string | null;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object' && body.errors?.length) {
    return body.errors.join(' ');
  }

  if (body && typeof body === 'object' && body.message) {
    return body.message;
  }

  if (error.status === 0) {
    return 'Unable to connect to the server.';
  }

  return error.message || 'An unexpected error occurred.';
}

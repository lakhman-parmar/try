import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

interface ApiErrorBody {
  message?: string;
  errors?: string[] | Record<string, string[]>;
  title?: string;
}

interface ErrorInfo {
  title: string;
  message: string;
}

const STATUS_TITLES: Record<number, string> = {
  400: 'Invalid Request',
  401: 'Unauthorized',
  403: 'Access Denied',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Validation Failed',
  500: 'Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

const STATUS_FALLBACKS: Record<number, string> = {
  400: 'The request could not be processed. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'The data may have been modified by another user. Please refresh and try again.',
  422: 'Please correct the highlighted fields and resubmit.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again.',
  503: 'The service is temporarily down. Please try again later.',
};

function isRecord(value: unknown): value is Record<string, string[]> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractErrorInfo(error: HttpErrorResponse): ErrorInfo {
  const body = error.error as ApiErrorBody | string | null;

  // 1 — Plain string body
  if (typeof body === 'string' && body.trim()) {
    return { title: STATUS_TITLES[error.status] ?? 'Error', message: body };
  }

  if (body && typeof body === 'object') {
    // 2 — ValidationProblemDetails (ASP.NET): errors is a dict, title instead of message
    if (isRecord(body.errors)) {
      const messages = Object.values(body.errors).flat().filter(Boolean);
      if (messages.length) {
        return {
          title: body.title ?? STATUS_TITLES[error.status] ?? 'Validation Failed',
          message: messages.join('; '),
        };
      }
    }

    // 3 — errors is string[]
    if (Array.isArray(body.errors) && body.errors.length) {
      return {
        title: STATUS_TITLES[error.status] ?? 'Error',
        message: body.errors.join(' '),
      };
    }

    // 4 — message property
    if (body.message) {
      return {
        title: STATUS_TITLES[error.status] ?? 'Error',
        message: body.message,
      };
    }
  }

  // 5 — Network error (no response)
  if (error.status === 0) {
    return {
      title: 'Connection Lost',
      message: 'Unable to reach the server. Please check your internet connection.',
    };
  }

  // 6 — Fallback with status context
  return {
    title: STATUS_TITLES[error.status] ?? 'Error',
    message: STATUS_FALLBACKS[error.status] ?? error.message ?? 'An unexpected error occurred. Please try again.',
  };
}

export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !req.url.includes('/adminAuth/refresh')) {
        const info = extractErrorInfo(error);
        toastService.show({ title: info.title, message: info.message, type: 'error' });
      }

      return throwError(() => error);
    }),
  );
};

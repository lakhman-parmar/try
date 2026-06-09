import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { CommonAuthService } from './features/auth/services/auth-service';
import { catchError } from 'rxjs/operators';
import { firstValueFrom, of } from 'rxjs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorToastInterceptor } from './core/interceptors/error-toast-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([errorToastInterceptor, authInterceptor])),
    provideRouter(routes),
    provideAppInitializer(() => {
      const authService = inject(CommonAuthService);
      return firstValueFrom(
        authService.refresh().pipe(
          catchError(() => of(null)), // failed refresh = app still loads
        ),
      );
    }),
  ],
};

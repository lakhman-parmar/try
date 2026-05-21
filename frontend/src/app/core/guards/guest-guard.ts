import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CommonAuthService } from '../../features/auth/services/auth-service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(CommonAuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.parseUrl('/admin/dashboard');
  }

  return true;
};

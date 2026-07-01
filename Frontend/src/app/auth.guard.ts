import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID); // Inject PLATFORM_ID

  // Check if the code is running in the browser
  if (isPlatformBrowser(platformId)) {
    const isLoggedIn = authService.isAuthenticated();

    if (!isLoggedIn) {
      router.navigate(['/signin']);
      return false;
    }
    return true;
  }

  // If on the server, block navigation
  return false;
};

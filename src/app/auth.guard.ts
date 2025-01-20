import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService); // Inject AuthService

  // Use the AuthService's currentUser$ observable to check if the user is authenticated
  const isLoggedIn = authService.isAuthenticated();

  if (!isLoggedIn) {
    router.navigate(['/signin']);
    return false;
  }

  return true;
};

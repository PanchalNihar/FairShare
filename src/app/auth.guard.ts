import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const isLoggedIn = !!localStorage.getItem('loggedInUser');
  if (isLoggedIn) {
    const router = inject(Router);
    router.navigate(['/signin']);
    return false;
  }
  return true;
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const isLoggedIn = !!localStorage.getItem('loggedInUser');
  if (isLoggedIn) {
    const router = inject(Router);
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

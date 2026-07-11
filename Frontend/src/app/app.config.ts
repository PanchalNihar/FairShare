import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {

  const cloned = req.clone({
    withCredentials: true
  });

  return next(cloned);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([credentialsInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

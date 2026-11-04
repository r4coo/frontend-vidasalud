import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/** Agrega "Authorization: Bearer <access token de Entra ID>" a las llamadas al BFF / API Gateway. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.demoMode) return next(req);
  const prefix = environment.apiBaseUrl ? `${environment.apiBaseUrl}/api/` : '/api/';
  if (!req.url.startsWith(prefix)) return next(req);
  const auth = inject(AuthService);
  return from(auth.accessToken()).pipe(
    switchMap((token) => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
  );
};

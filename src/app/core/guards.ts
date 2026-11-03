import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.session() ? true : inject(Router).parseUrl('/login');
};

/** Uso: data: { roles: ['Admin'] } — si el rol no alcanza vuelve a Inicio. */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const roles = (route.data?.['roles'] ?? []) as Role[];
  if (!auth.session()) return inject(Router).parseUrl('/login');
  return roles.length === 0 || auth.hasRole(...roles) ? true : inject(Router).parseUrl('/inicio');
};

import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../environments/environment';
import { ROLES, Role, Session } from './models';

const DEMO_KEY = 'vidasalud.demo.session';

export function apiScopes(): string[] {
  return [`api://${environment.apiClientId}/access_as_user`];
}

function decodeRoles(jwt: string): Role[] {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const roles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
    return roles.filter((r): r is Role => (ROLES as string[]).includes(r));
  } catch {
    return [];
  }
}

/**
 * Sesión del usuario. Con Entra ID configurado usa MSAL (los roles vienen en el access token de la API,
 * claim `roles` = App roles). Sin configurar, funciona en modo demostración con un rol elegido en el login.
 * Esto es solo para mostrar/ocultar pantallas: el BFF vuelve a validar el token y los roles en cada llamada.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService, { optional: true });
  private readonly router = inject(Router);

  readonly session = signal<Session | null>(null);
  readonly demo = environment.demoMode;

  async init(): Promise<void> {
    if (this.demo) {
      try {
        const raw = sessionStorage.getItem(DEMO_KEY);
        if (raw) this.session.set(JSON.parse(raw));
      } catch { /* sin storage */ }
      return;
    }
    await this.msal!.instance.initialize();
    const result = await this.msal!.instance.handleRedirectPromise();
    if (result?.account) this.msal!.instance.setActiveAccount(result.account);
    else {
      const acc = this.msal!.instance.getAllAccounts()[0];
      if (acc) this.msal!.instance.setActiveAccount(acc);
    }
    await this.loadSession();
  }

  private async loadSession(): Promise<void> {
    const account = this.msal!.instance.getActiveAccount();
    if (!account) { this.session.set(null); return; }
    let roles: Role[] = [];
    try {
      const tok = await this.msal!.instance.acquireTokenSilent({ scopes: apiScopes(), account });
      roles = decodeRoles(tok.accessToken);
    } catch {
      // Sin token válido: obliga a iniciar sesión de nuevo.
      this.session.set(null);
      return;
    }
    this.session.set({ name: account.name ?? account.username, email: account.username, roles });
  }

  hasRole(...roles: Role[]): boolean {
    const s = this.session();
    return !!s && s.roles.some((r) => roles.includes(r));
  }

  login(loginHint?: string): Promise<void> {
    return this.msal!.instance.loginRedirect({ scopes: ['openid', 'profile', ...apiScopes()], loginHint: loginHint || undefined });
  }

  demoLogin(role: Role, email: string): void {
    const s: Session = { name: email.split('@')[0] || role, email, roles: [role] };
    this.session.set(s);
    try { sessionStorage.setItem(DEMO_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }

  logout(): void {
    this.session.set(null);
    if (this.demo) {
      try { sessionStorage.removeItem(DEMO_KEY); } catch { /* ignore */ }
      this.router.navigateByUrl('/login');
      return;
    }
    void this.msal!.instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin + '/login' });
  }

  homeUrl(): string { return '/inicio'; }
}

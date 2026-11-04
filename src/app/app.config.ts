import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MSAL_INSTANCE, MsalService } from '@azure/msal-angular';
import { BrowserCacheLocation, IPublicClientApplication, LogLevel, PublicClientApplication } from '@azure/msal-browser';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { authInterceptor } from './core/auth.interceptor';

export function msalInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.spaClientId,
      authority: `https://login.microsoftonline.com/${environment.tenantId}`,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin + '/login',
      navigateToLoginRequestUrl: true,
    },
    cache: { cacheLocation: BrowserCacheLocation.SessionStorage },
    system: { loggerOptions: { logLevel: LogLevel.Warning, piiLoggingEnabled: false } },
  });
}

function initAuth(auth: AuthService) {
  return () => auth.init();
}

const msalProviders = environment.demoMode
  ? []
  : [{ provide: MSAL_INSTANCE, useFactory: msalInstanceFactory }, MsalService];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // Interceptor funcional propio: adjunta el access token de Entra ID a las llamadas a /api
    provideHttpClient(withInterceptors([authInterceptor])),
    ...msalProviders,
    { provide: APP_INITIALIZER, useFactory: initAuth, deps: [AuthService], multi: true },
  ],
};

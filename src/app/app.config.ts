import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalInterceptor, MsalInterceptorConfiguration, MsalService,
} from '@azure/msal-angular';
import { BrowserCacheLocation, InteractionType, IPublicClientApplication, LogLevel, PublicClientApplication } from '@azure/msal-browser';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthService, apiScopes } from './core/auth.service';

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

export function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  // Toda llamada al BFF (relativa "/api/*" o con la URL absoluta de API Gateway) lleva el access token.
  const protectedResourceMap = new Map<string, string[]>();
  protectedResourceMap.set(`${environment.apiBaseUrl || window.location.origin}/api/*`, apiScopes());
  return { interactionType: InteractionType.Redirect, protectedResourceMap };
}

function initAuth(auth: AuthService) {
  return () => auth.init();
}

const msalProviders = environment.demoMode
  ? []
  : [
      { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },
      { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: msalInterceptorConfigFactory },
      { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
      MsalService,
    ];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    ...msalProviders,
    { provide: APP_INITIALIZER, useFactory: initAuth, deps: [AuthService], multi: true },
  ],
};

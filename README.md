# frontend-vidasalud (Angular 18 + MSAL)

SPA de VidaSalud: login con Microsoft Entra ID (MSAL), inicio, agendar cita, atenciones (estados), catálogo,
consulta (videollamada local), historial, **Kafka en vivo** (métricas de streaming) y administración RabbitMQ (solo Admin).

Las atenciones se **actualizan solas cada 5 segundos** (sin recargar), y *Kafka en vivo* consulta `GET /api/analytics/resumen` cada 5 s: contadores de eventos, estados y cupos disponibles que alimenta Kafka.

## Ejecutar
```bash
npm install
cp .env.example .env     # completar ENTRA_* (si se deja vacío arranca en MODO DEMO sin backend)
npm start                # http://localhost:4200  (proxy /api -> http://localhost:8084)
```
`npm run config` genera `src/environments/environment.ts` desde `.env` o variables de entorno.

## Roles (App roles de Entra ID, claim `roles` del access token de la API)
| Rol | Pantallas |
|---|---|
| Paciente | Inicio, Agendar, Atenciones (propias, solo cancela), Consulta, Historial |
| Recepcionista | + Catálogo (crear/editar), confirmar/avanzar estados de todas las atenciones, Kafka en vivo |
| Admin | + eliminar en catálogo, Kafka en vivo y Administración RabbitMQ |

La administración de Kafka (tópicos, grupos, lag) se hace en Kafka UI y por la API `/api/admin/kafka/**`; no tiene pantalla propia.

El front solo oculta pantallas; el BFF valida token y rol en cada llamada.

## Autenticación
`AuthService` usa MSAL (`loginRedirect`, `acquireTokenSilent`). Un interceptor funcional (`core/auth.interceptor.ts`) agrega
`Authorization: Bearer <token>` a las llamadas a `/api` (o a `API_BASE_URL/api`). Los roles se leen del claim `roles` del access token.

## Despliegue en Vercel
`vercel.json` define el build (`npm run build`), la salida `dist/frontend-vidasalud/browser` y la reescritura a `index.html` (SPA). Variables de entorno en Vercel (Settings → Environment Variables): `ENTRA_TENANT_ID`, `ENTRA_SPA_CLIENT_ID`, `ENTRA_API_CLIENT_ID`, `API_BASE_URL` (URL de API Gateway, sin `/` final).
Cada push a `main` genera un deployment nuevo. Además hay que:
1. Registrar la URL de Vercel como *Redirect URI* de tipo SPA en la app `vidasalud-spa` de Entra ID (MSAL usa `window.location.origin`).
2. Permitir el origen en el CORS de API Gateway y en `FRONTEND_URLS` del BFF.

## Docker
`docker build --build-arg ENTRA_TENANT_ID=... --build-arg ENTRA_SPA_CLIENT_ID=... --build-arg ENTRA_API_CLIENT_ID=... --build-arg API_BASE_URL=https://<api-gw> -t frontend-vidasalud .`

> Compilación: `npm install && npm run build`. Si Vercel falla, el log de build indica el error de TypeScript a corregir.

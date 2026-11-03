# frontend-vidasalud (Angular 18 + MSAL)

SPA de VidaSalud: login con Microsoft Entra ID (MSAL), inicio, agendar cita, atenciones (estados), catálogo,
consulta (videollamada local), historial y administración RabbitMQ (solo Admin).

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
| Recepcionista | + Catálogo (crear/editar), confirmar/avanzar estados de todas las atenciones |
| Admin | + eliminar en catálogo y Administración RabbitMQ |

El front solo oculta pantallas; el BFF valida token y rol en cada llamada.

## Docker
`docker build --build-arg ENTRA_TENANT_ID=... --build-arg ENTRA_SPA_CLIENT_ID=... --build-arg ENTRA_API_CLIENT_ID=... --build-arg API_BASE_URL=https://<api-gw> -t frontend-vidasalud .`

> Nota: el código no se ha compilado en el entorno de generación (sin acceso a npm). Ejecutar `npm install && npm run build` y corregir lo que aparezca.

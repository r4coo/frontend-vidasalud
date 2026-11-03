// Genera src/environments/environment.ts desde variables de entorno (o desde .env).
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const env = { ...process.env };
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2];
  }
}

const tenantId = env.ENTRA_TENANT_ID ?? '';
const spaClientId = env.ENTRA_SPA_CLIENT_ID ?? '';
const apiClientId = env.ENTRA_API_CLIENT_ID ?? '';
const apiBaseUrl = (env.API_BASE_URL ?? '').replace(/\/$/, '');
const configured = [tenantId, spaClientId, apiClientId].every((v) => v && !v.startsWith('<'));

mkdirSync('src/environments', { recursive: true });
writeFileSync(
  'src/environments/environment.ts',
  `// ARCHIVO GENERADO por scripts/set-env.mjs — no editar a mano.
export const environment = {
  tenantId: ${JSON.stringify(configured ? tenantId : '')},
  spaClientId: ${JSON.stringify(configured ? spaClientId : '')},
  apiClientId: ${JSON.stringify(configured ? apiClientId : '')},
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
  /** Sin Entra ID configurado, la app corre en modo demostración (datos en memoria). */
  demoMode: ${!configured},
};
`,
);
console.log(configured ? 'environment.ts generado (Entra ID configurado)' : 'environment.ts generado en MODO DEMO (falta configurar Entra ID)');

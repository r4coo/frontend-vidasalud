import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', loadComponent: () => import('./pages/inicio.component').then((m) => m.InicioComponent) },
      { path: 'agendar', canActivate: [roleGuard], data: { roles: ['Paciente', 'Recepcionista', 'Admin'] },
        loadComponent: () => import('./pages/agendar.component').then((m) => m.AgendarComponent) },
      { path: 'atenciones', loadComponent: () => import('./pages/atenciones.component').then((m) => m.AtencionesComponent) },
      { path: 'catalogo', canActivate: [roleGuard], data: { roles: ['Recepcionista', 'Admin'] },
        loadComponent: () => import('./pages/catalogo.component').then((m) => m.CatalogoComponent) },
      { path: 'consulta', loadComponent: () => import('./pages/consulta.component').then((m) => m.ConsultaComponent) },
      { path: 'historial', loadComponent: () => import('./pages/historial.component').then((m) => m.HistorialComponent) },
      { path: 'admin', canActivate: [roleGuard], data: { roles: ['Admin'] },
        loadComponent: () => import('./pages/admin.component').then((m) => m.AdminComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];

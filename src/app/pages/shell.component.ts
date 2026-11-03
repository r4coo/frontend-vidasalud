import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Role } from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from '../shared/logo.component';

interface NavItem { path: string; label: string; icon: string; roles: Role[] }
const ALL: Role[] = ['Admin', 'Recepcionista', 'Paciente'];
const NAV: NavItem[] = [
  { path: '/inicio', label: 'Inicio', icon: 'home', roles: ALL },
  { path: '/agendar', label: 'Agendar cita', icon: 'plus', roles: ALL },
  { path: '/atenciones', label: 'Atenciones', icon: 'calendar', roles: ALL },
  { path: '/consulta', label: 'Consulta', icon: 'video', roles: ALL },
  { path: '/historial', label: 'Historial', icon: 'file', roles: ALL },
  { path: '/catalogo', label: 'Catálogo', icon: 'box', roles: ['Recepcionista', 'Admin'] },
  { path: '/admin', label: 'RabbitMQ', icon: 'server', roles: ['Admin'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  template: `
  <div class="layout">
    <aside class="side">
      <app-logo />
      <nav aria-label="Principal">
        @for (n of nav(); track n.path) {
          <a [routerLink]="n.path" routerLinkActive="active"><app-icon [name]="n.icon" />{{ n.label }}</a>
        }
      </nav>
      <div class="tag"><app-icon name="stetho" [size]="16" /> Telemedicina para un mejor futuro</div>
    </aside>
    <div class="main">
      <header>
        <div class="mobile-logo"><app-logo /></div>
        <span class="spacer"></span>
        <div class="row">
          <div class="who"><b>{{ auth.session()?.name }}</b><span class="small muted">{{ roleText() }}</span></div>
          <div class="avatar">{{ initials() }}</div>
          <button class="btn sm" (click)="auth.logout()" aria-label="Cerrar sesión"><app-icon name="logout" [size]="16" /><span class="hide-m">Salir</span></button>
        </div>
      </header>
      <main><router-outlet /></main>
    </div>
    <nav class="bottom" aria-label="Navegación móvil">
      @for (n of mobileNav(); track n.path) {
        <a [routerLink]="n.path" routerLinkActive="active"><app-icon [name]="n.icon" /><span>{{ n.label }}</span></a>
      }
    </nav>
  </div>`,
  styles: [`
  .layout{min-height:100vh;display:grid;grid-template-columns:232px 1fr}
  .side{background:#fff;border-right:1px solid var(--border);padding:16px;display:flex;flex-direction:column;gap:20px;position:sticky;top:0;height:100vh}
  .side nav{display:flex;flex-direction:column;gap:4px;flex:1}
  .side a{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:10px;color:var(--muted-fg);font-weight:500}
  .side a:hover,.bottom a:hover{background:#e3edff55}
  .side a.active{background:#e3edff;color:var(--secondary-fg)}
  .tag{display:flex;gap:8px;background:var(--secondary);color:var(--secondary-fg);border-radius:10px;padding:12px;font-size:12px}
  .main{min-width:0;display:flex;flex-direction:column}
  header{position:sticky;top:0;z-index:5;height:64px;background:#ffffffe6;backdrop-filter:blur(8px);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:12px}
  .spacer{flex:1}.who{display:flex;flex-direction:column;text-align:right;line-height:1.2}
  main{padding:24px;max-width:1180px;width:100%}
  .mobile-logo,.bottom{display:none}
  @media(max-width:900px){
    .layout{grid-template-columns:1fr}.side{display:none}.mobile-logo{display:block}.hide-m{display:none}.who{display:none}
    header{padding:0 16px}main{padding:16px 16px 88px}
    .bottom{display:flex;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--border);justify-content:space-around;padding:6px 4px;z-index:10}
    .bottom a{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;color:var(--muted-fg);padding:6px 8px;border-radius:10px;min-width:56px}
    .bottom a.active{color:var(--primary)}
  }`],
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly nav = computed(() => NAV.filter((n) => this.auth.hasRole(...n.roles)));
  protected readonly mobileNav = computed(() => this.nav().slice(0, 5));
  protected readonly roleText = computed(() => this.auth.session()?.roles.join(', ') || 'Sin rol asignado');
  protected readonly initials = computed(() =>
    (this.auth.session()?.name ?? '?').split(/[\s._@-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join(''));
}

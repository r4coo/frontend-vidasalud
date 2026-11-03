import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ROLES, Role } from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IconComponent, LogoComponent],
  template: `
  <main class="auth">
    <section class="hero">
      <app-logo />
      <h2>Telemedicina para un mejor futuro</h2>
      <p>Agenda, confirma y atiende consultas médicas a distancia, con tu equipo de salud, desde cualquier lugar.</p>
      <ul><li>Consultas por videollamada</li><li>Historial clínico en un solo lugar</li><li>Recordatorios y notificaciones automáticas</li></ul>
    </section>
    <section class="panel">
      <h1>Iniciar sesión</h1>
      <p class="muted">Accede con tu cuenta institucional para continuar</p>

      @if (auth.demo) {
        <div class="alert info" style="margin:16px 0">
          Modo demostración: Entra ID aún no está configurado. Los datos viven solo en el navegador.
        </div>
      }
      <form (ngSubmit)="submit()" class="form">
        <div class="field">
          <label for="email">Correo electrónico @if (!auth.demo) {<span class="muted">(opcional)</span>}</label>
          <input id="email" name="email" type="email" autocomplete="email" [(ngModel)]="email" placeholder="usuario@ejemplo.com">
        </div>
        @if (auth.demo) {
          <div class="field">
            <label for="rol">Rol de prueba</label>
            <select id="rol" name="rol" [(ngModel)]="role">
              @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
            </select>
          </div>
        }
        @if (error()) { <div role="alert" class="alert error" style="margin-bottom:14px">{{ error() }}</div> }
        <button class="btn primary" style="width:100%;height:44px" [disabled]="loading()">
          {{ loading() ? 'Redirigiendo…' : auth.demo ? 'Ingresar (demo)' : 'Ingresar con Microsoft' }}
        </button>
      </form>
      <p class="small muted note"><app-icon name="shield" [size]="16" />
        La contraseña se ingresa en Microsoft Entra ID; VidaSalud nunca la ve.</p>
    </section>
  </main>`,
  styles: [`
  .auth{min-height:100vh;display:grid;grid-template-columns:1fr 1fr}
  .hero{background:linear-gradient(160deg,#1e63e9,#0e3ea6);color:#fff;padding:56px;display:flex;flex-direction:column;justify-content:center;gap:18px}
  .hero :is(app-logo){--x:0} .hero ::ng-deep b span{color:#bcd3ff} .hero ::ng-deep .mark{background:#ffffff26}
  .hero h2{font-size:30px;line-height:1.2;font-weight:700;margin-top:24px;max-width:420px}
  .hero p{max-width:420px;opacity:.9;margin:0}
  .hero ul{padding-left:18px;opacity:.95;display:grid;gap:6px;margin:0}
  .panel{display:flex;flex-direction:column;justify-content:center;padding:56px;max-width:480px;width:100%;margin:auto}
  .form{margin-top:24px}.note{display:flex;gap:8px;margin-top:20px;align-items:flex-start}
  @media(max-width:900px){.auth{grid-template-columns:1fr}.hero{padding:32px 24px}.hero ul{display:none}.panel{padding:32px 24px}}
  `],
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly roles = ROLES;
  email = '';
  role: Role = 'Paciente';
  error = signal('');
  loading = signal(false);

  constructor() {
    if (this.auth.session()) this.router.navigateByUrl('/inicio');
  }

  async submit() {
    this.error.set('');
    if (this.auth.demo) {
      this.auth.demoLogin(this.role, this.email || `${this.role.toLowerCase()}@demo.cl`);
      this.router.navigateByUrl('/inicio');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.login(this.email);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
      this.loading.set(false);
    }
  }
}

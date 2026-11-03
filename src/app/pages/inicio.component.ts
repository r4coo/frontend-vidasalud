import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService, mensajeError } from '../core/api.service';
import { Atencion } from '../core/models';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
  <div class="row between wrap" style="margin-bottom:20px">
    <div><h1>Hola, {{ auth.session()?.name }}</h1>
      <p class="muted" style="margin:4px 0 0">{{ hoy }}</p></div>
    <a class="btn primary" routerLink="/agendar"><app-icon name="plus" [size]="16" />Agendar cita</a>
  </div>
  @if (error()) { <div class="alert error" role="alert">{{ error() }}</div> }
  @if (!auth.session()?.roles?.length) {
    <div class="alert error">Tu cuenta no tiene un rol de aplicación asignado (Admin, Recepcionista o Paciente). Pide al administrador que lo asigne en Entra ID.</div>
  }
  <div class="grid cols-4" style="margin-bottom:16px">
    <div class="card"><div class="muted small">Atenciones</div><div class="stat">{{ items().length }}</div></div>
    <div class="card"><div class="muted small">Por confirmar</div><div class="stat">{{ count('SOLICITADA') }}</div></div>
    <div class="card"><div class="muted small">Confirmadas</div><div class="stat">{{ count('CONFIRMADA') }}</div></div>
    <div class="card"><div class="muted small">En sala de espera</div><div class="stat">{{ count('EN_ESPERA') }}</div></div>
  </div>
  <div class="grid cols-2">
    <section class="card"><h2 style="margin-bottom:12px">Próximas atenciones</h2>
      @for (a of proximas(); track a.id) {
        <div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div class="row"><div class="avatar"><app-icon name="calendar" [size]="16"/></div>
            <div><b>{{ a.prestacion }}</b><div class="small muted">{{ a.fecha }} · {{ a.hora }}</div></div></div>
          <span class="badge" [class]="a.estado">{{ a.estado }}</span>
        </div>
      } @empty { <p class="muted">No hay atenciones próximas.</p> }
      <a routerLink="/atenciones" class="small" style="color:var(--primary);display:inline-block;margin-top:12px">Ver todas</a>
    </section>
    <section class="card"><h2 style="margin-bottom:12px">Accesos rápidos</h2>
      <div class="grid" style="gap:10px">
        <a class="btn" routerLink="/consulta"><app-icon name="video" [size]="16"/>Entrar a consulta</a>
        <a class="btn" routerLink="/historial"><app-icon name="file" [size]="16"/>Historial clínico</a>
        @if (auth.hasRole('Recepcionista','Admin')) { <a class="btn" routerLink="/catalogo"><app-icon name="box" [size]="16"/>Catálogo y cupos</a> }
        @if (auth.hasRole('Admin')) { <a class="btn" routerLink="/admin"><app-icon name="server" [size]="16"/>Administración RabbitMQ</a> }
      </div>
    </section>
  </div>`,
})
export class InicioComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly items = signal<Atencion[]>([]);
  protected readonly error = signal('');
  protected readonly hoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  protected readonly proximas = computed(() =>
    this.items().filter((a) => a.estado !== 'CANCELADA' && a.estado !== 'CERRADA')
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)).slice(0, 4));

  count(e: string) { return this.items().filter((a) => a.estado === e).length; }

  ngOnInit() {
    this.api.atenciones().subscribe({ next: (r) => this.items.set(r), error: (e) => this.error.set(mensajeError(e)) });
  }
}

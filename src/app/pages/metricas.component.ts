import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { ApiService, mensajeError } from '../core/api.service';
import { AnalyticsResumen } from '../core/models';

/**
 * Métricas en tiempo real construidas por los consumidores Kafka (grupos vidasalud-analitica y vidasalud-alertas).
 * Se refresca sola cada 5 segundos: al llegar un evento nuevo el resultado aparece sin intervención manual.
 */
@Component({
  selector: 'app-metricas',
  standalone: true,
  template: `
  <div class="row between" style="margin-bottom:4px"><h1>Kafka en vivo</h1><span class="small muted">Se actualiza cada 5 s</span></div>
  <p class="muted" style="margin:0 0 16px">Métricas que arman los consumidores Kafka a partir de los eventos de <code>vidasalud.atenciones.eventos</code> y <code>vidasalud.catalogo.cupos</code>.</p>
  @if (error()) { <div class="alert error" role="alert" style="margin-bottom:12px">{{ error() }}</div> }
  @if (r(); as m) {
    <div class="grid cols-3" style="margin-bottom:16px">
      <section class="card"><div class="small muted">Eventos de atenciones</div><div style="font-size:32px;font-weight:700">{{ m.eventosAtenciones }}</div></section>
      <section class="card"><div class="small muted">Eventos de cupos</div><div style="font-size:32px;font-weight:700">{{ m.eventosCupos }}</div></section>
      <section class="card"><div class="small muted">Duplicados descartados</div><div style="font-size:32px;font-weight:700">{{ m.duplicadosDescartados }}</div></section>
    </div>
    <div class="grid cols-2" style="margin-bottom:16px">
      <section class="card"><h2 style="margin-bottom:12px">Eventos por tipo</h2>
        @for (k of claves(m.porTipo); track k) { <div class="row between"><span class="badge" [class]="k">{{ k }}</span><b>{{ m.porTipo[k] }}</b></div> }
        @empty { <p class="muted">Sin eventos todavía.</p> }
      </section>
      <section class="card"><h2 style="margin-bottom:12px">Eventos por prestación</h2>
        @for (k of claves(m.porPrestacion); track k) { <div class="row between"><span>{{ k }}</span><b>{{ m.porPrestacion[k] }}</b></div> }
        @empty { <p class="muted">Sin eventos todavía.</p> }
      </section>
    </div>
    <div class="grid cols-2">
      <section class="card"><h2 style="margin-bottom:12px">Cupos disponibles (último valor)</h2>
        <p class="small muted" style="margin:0 0 8px">Clave: prestación | fecha | hora</p>
        @for (k of claves(m.cuposDisponibles); track k) { <div class="row between"><code>{{ k }}</code><b>{{ m.cuposDisponibles[k] }}</b></div> }
        @empty { <p class="muted">Sin datos todavía.</p> }
      </section>
      <section class="card"><h2 style="margin-bottom:12px">Alertas recientes</h2>
        @for (a of m.alertasRecientes; track $index) { <div class="alert error" style="margin-bottom:6px">{{ a }}</div> }
        @empty { <p class="muted">Sin alertas.</p> }
      </section>
    </div>
    <p class="small muted" style="margin-top:12px">Última actividad: {{ m.ultimaActividad ?? '—' }}</p>
  } @else if (!error()) { <p class="muted">Cargando…</p> }`,
})
export class MetricasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly r = signal<AnalyticsResumen | null>(null);
  protected readonly error = signal('');

  claves(o: Record<string, number>) { return Object.keys(o).sort(); }

  ngOnInit() {
    timer(0, 5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (document.hidden) return;
      this.api.analitica().subscribe({
        next: (m) => { this.r.set(m); this.error.set(''); },
        error: (e) => this.error.set(mensajeError(e)),
      });
    });
  }
}

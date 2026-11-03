import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, mensajeError } from '../core/api.service';
import { Atencion } from '../core/models';
import { DEMO_HISTORIAL } from '../core/demo-data';

@Component({
  selector: 'app-historial',
  standalone: true,
  template: `
  <h1 style="margin-bottom:16px">Historial clínico</h1>
  @if (error()) { <div class="alert error" role="alert" style="margin-bottom:12px">{{ error() }}</div> }
  <section class="card" style="margin-bottom:16px">
    <h2 style="margin-bottom:12px">Atenciones cerradas</h2>
    @for (a of cerradas(); track a.id) {
      <div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div><b>{{ a.prestacion }}</b><div class="small muted">{{ a.fecha }} · {{ a.hora }}</div></div><span class="badge CERRADA">CERRADA</span>
      </div>
    } @empty { <p class="muted">Aún no hay atenciones cerradas.</p> }
  </section>
  <section class="card">
    <h2 style="margin-bottom:4px">Notas clínicas</h2>
    <p class="small muted">Datos de ejemplo: el alcance de las guías no incluye un microservicio de fichas clínicas.</p>
    @for (h of historial; track h.fecha) {
      <div style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div class="row between"><b>{{ h.tipo }}</b><span class="small muted">{{ h.fecha }}</span></div>
        <div class="small muted">{{ h.profesional }}</div><p style="margin:6px 0 0">{{ h.nota }}</p>
      </div>
    }
  </section>`,
})
export class HistorialComponent implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly historial = DEMO_HISTORIAL;
  protected readonly cerradas = signal<Atencion[]>([]);
  protected readonly error = signal('');
  ngOnInit() {
    this.api.atenciones().subscribe({
      next: (r) => this.cerradas.set(r.filter((a) => a.estado === 'CERRADA')),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}

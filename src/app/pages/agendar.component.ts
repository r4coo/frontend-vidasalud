import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, mensajeError } from '../core/api.service';
import { Cupo, Prestacion } from '../core/models';

@Component({
  selector: 'app-agendar',
  standalone: true,
  imports: [FormsModule],
  template: `
  <h1 style="margin-bottom:4px">Agendar cita</h1>
  <p class="muted" style="margin:0 0 20px">Elige una prestación, la fecha y un horario con cupo disponible.</p>
  <div class="grid cols-2">
    <section class="card">
      <h2 style="margin-bottom:14px">1. Prestación y fecha</h2>
      <div class="field"><label for="p">Prestación</label>
        <select id="p" [ngModel]="prestacionId()" (ngModelChange)="prestacionId.set($event); buscar()">
          <option [ngValue]="0" disabled>Selecciona…</option>
          @for (p of prestaciones(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }} · {{ p.duracionMin }} min</option> }
        </select></div>
      <div class="field"><label for="f">Fecha</label>
        <input id="f" type="date" [min]="hoy" [ngModel]="fecha()" (ngModelChange)="fecha.set($event); buscar()"></div>
    </section>
    <section class="card">
      <h2 style="margin-bottom:14px">2. Horario</h2>
      @if (!prestacionId() || !fecha()) { <p class="muted">Selecciona prestación y fecha.</p> }
      @else if (cargando()) { <p class="muted">Buscando cupos…</p> }
      @else {
        <div class="slots">
          @for (c of cupos(); track c.id) {
            <button type="button" class="slot" [class.sel]="hora() === c.hora" [disabled]="c.disponibles === 0" (click)="hora.set(c.hora)">
              {{ c.hora }}<small>{{ c.disponibles === 0 ? 'sin cupo' : c.disponibles + ' cupo(s)' }}</small>
            </button>
          } @empty { <p class="muted">No hay cupos para esa fecha.</p> }
        </div>
      }
    </section>
  </div>
  @if (error()) { <div class="alert error" role="alert" style="margin-top:16px">{{ error() }}</div> }
  <div class="row" style="margin-top:20px">
    <button class="btn primary" [disabled]="!hora() || enviando()" (click)="confirmar()">{{ enviando() ? 'Enviando…' : 'Solicitar cita' }}</button>
    <span class="muted small">La cita queda SOLICITADA hasta que recepción la confirme.</span>
  </div>`,
  styles: [`.slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .slot{display:flex;flex-direction:column;align-items:center;padding:10px 4px;border:1px solid var(--input);background:#fff;border-radius:10px;font-weight:600}
  .slot small{font-weight:400;font-size:10px;color:var(--muted-fg)}
  .slot.sel{background:var(--primary);color:#fff;border-color:var(--primary)}.slot.sel small{color:#dbe7ff}
  .slot:disabled{opacity:.45;cursor:not-allowed}`],
})
export class AgendarComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly hoy = new Date().toISOString().slice(0, 10);
  protected readonly prestaciones = signal<Prestacion[]>([]);
  protected readonly cupos = signal<Cupo[]>([]);
  protected readonly prestacionId = signal(0);
  protected readonly fecha = signal('');
  protected readonly hora = signal('');
  protected readonly cargando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  ngOnInit() {
    this.api.prestaciones().subscribe({
      next: (r) => this.prestaciones.set(r.filter((p) => p.activa)),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  buscar() {
    this.hora.set(''); this.cupos.set([]);
    if (!this.prestacionId() || !this.fecha()) return;
    this.cargando.set(true);
    this.api.cupos(this.prestacionId(), this.fecha()).subscribe({
      next: (r) => { this.cupos.set(r); this.cargando.set(false); },
      error: (e) => { this.error.set(mensajeError(e)); this.cargando.set(false); },
    });
  }

  confirmar() {
    const p = this.prestaciones().find((x) => x.id === this.prestacionId());
    if (!p || !this.hora()) return;
    this.error.set(''); this.enviando.set(true);
    this.api.crearAtencion({ prestacionId: p.id!, prestacion: p.nombre, fecha: this.fecha(), hora: this.hora() }).subscribe({
      next: () => this.router.navigateByUrl('/atenciones'),
      error: (e) => { this.error.set(mensajeError(e)); this.enviando.set(false); },
    });
  }
}

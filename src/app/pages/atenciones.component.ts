import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { ApiService, mensajeError } from '../core/api.service';
import { Atencion, EstadoAtencion, TRANSICIONES } from '../core/models';

const ETIQUETA: Partial<Record<EstadoAtencion, string>> = {
  CONFIRMADA: 'Confirmar', EN_ESPERA: 'Pasar a espera', EN_ATENCION: 'Iniciar atención', CERRADA: 'Cerrar', CANCELADA: 'Cancelar',
};

@Component({
  selector: 'app-atenciones',
  standalone: true,
  template: `
  <div class="row between" style="margin-bottom:16px">
    <h1>Atenciones</h1><button class="btn sm" (click)="cargar()">Actualizar</button>
  </div>
  @if (error()) { <div class="alert error" role="alert" style="margin-bottom:12px">{{ error() }}</div> }
  @if (info()) { <div class="alert ok" role="status" style="margin-bottom:12px">{{ info() }}</div> }
  <div class="card table-wrap">
    <table>
      <thead><tr><th>Prestación</th><th>Fecha</th><th>Hora</th>@if (staff()) {<th>Paciente</th>}<th>Estado</th><th></th></tr></thead>
      <tbody>
        @for (a of items(); track a.id) {
          <tr>
            <td><b>{{ a.prestacion }}</b></td><td>{{ a.fecha }}</td><td>{{ a.hora }}</td>
            @if (staff()) { <td>{{ a.paciente }}</td> }
            <td><span class="badge" [class]="a.estado">{{ a.estado }}</span>@if (a.motivo) {<div class="small muted">{{ a.motivo }}</div>}</td>
            <td style="text-align:right;white-space:nowrap">
              @for (e of acciones(a); track e) {
                <button class="btn sm" [class.danger]="e === 'CANCELADA'" [class.primary]="e !== 'CANCELADA'" style="margin-left:6px" (click)="mover(a, e)" [disabled]="ocupado() === a.id">{{ etiqueta(e) }}</button>
              }
            </td>
          </tr>
        } @empty { <tr><td colspan="6" class="muted">Sin atenciones.</td></tr> }
      </tbody>
    </table>
  </div>
  <p class="small muted" style="margin-top:10px">Confirmar es asíncrono: se envía un comando a RabbitMQ, el catálogo descuenta el cupo y el estado se actualiza cuando llega el evento (pulsa «Actualizar»).</p>`,
})
export class AtencionesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  protected readonly items = signal<Atencion[]>([]);
  protected readonly error = signal('');
  protected readonly info = signal('');
  protected readonly ocupado = signal('');

  staff() { return this.auth.hasRole('Recepcionista', 'Admin'); }
  etiqueta(e: EstadoAtencion) { return ETIQUETA[e] ?? e; }

  /** Qué botones mostrar: el paciente solo cancela; recepción/admin hacen todas las transiciones válidas. */
  acciones(a: Atencion): EstadoAtencion[] {
    const posibles = TRANSICIONES[a.estado];
    return this.staff() ? posibles : posibles.filter((e) => e === 'CANCELADA');
  }

  ngOnInit() { this.cargar(); }

  cargar() {
    this.api.atenciones().subscribe({
      next: (r) => { this.items.set([...r].sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))); this.error.set(''); },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  mover(a: Atencion, estado: EstadoAtencion) {
    this.error.set(''); this.info.set(''); this.ocupado.set(a.id);
    this.api.cambiarEstado(a.id, estado).subscribe({
      next: () => {
        this.ocupado.set('');
        if (estado === 'CONFIRMADA') this.info.set('Confirmación enviada. Se aplicará cuando el catálogo reserve el cupo.');
        this.cargar();
        if (estado === 'CONFIRMADA') setTimeout(() => this.cargar(), 2000);
      },
      error: (e) => { this.ocupado.set(''); this.error.set(mensajeError(e)); },
    });
  }
}

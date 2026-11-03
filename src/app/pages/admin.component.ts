import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService, mensajeError } from '../core/api.service';
import { BindingRequest, ExchangeRequest, QueueRequest } from '../core/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
  <h1 style="margin-bottom:4px">Administración RabbitMQ</h1>
  <p class="muted" style="margin:0 0 16px">Solo rol Admin. Las operaciones pasan por el BFF hacia <code>ms-vidasalud-rabbit-admin</code>.</p>
  @if (error()) { <div class="alert error" role="alert" style="margin-bottom:12px">{{ error() }}</div> }
  @if (resultado()) { <pre class="alert ok" style="white-space:pre-wrap;margin:0 0 12px">{{ resultado() }}</pre> }
  <div class="grid cols-2">
    <section class="card"><h2 style="margin-bottom:12px">Cola</h2>
      <div class="field"><label for="qn">Nombre</label><input id="qn" [(ngModel)]="cola.name" placeholder="q.ejemplo"></div>
      <div class="field"><label for="qd">Dead-letter exchange (opcional)</label><input id="qd" [(ngModel)]="cola.deadLetterExchange" placeholder="vidasalud.dlx.direct"></div>
      <div class="field"><label for="qk">Dead-letter routing key (opcional)</label><input id="qk" [(ngModel)]="cola.deadLetterRoutingKey" placeholder="q.ejemplo.dlq"></div>
      <div class="row wrap">
        <button class="btn primary" (click)="run(api.crearCola(cola))">Crear</button>
        <button class="btn" (click)="run(api.infoCola(cola.name))">Info</button>
        <button class="btn" (click)="run(api.purgarCola(cola.name))">Purgar</button>
        <button class="btn danger" (click)="run(api.eliminarCola(cola.name))">Eliminar</button>
      </div></section>
    <section class="card"><h2 style="margin-bottom:12px">Exchange</h2>
      <div class="field"><label for="en">Nombre</label><input id="en" [(ngModel)]="ex.name" placeholder="vidasalud.ejemplo.topic"></div>
      <div class="field"><label for="et">Tipo</label>
        <select id="et" [(ngModel)]="ex.type"><option>direct</option><option>topic</option><option>fanout</option><option>headers</option></select></div>
      <button class="btn primary" (click)="run(api.crearExchange(ex))">Crear exchange</button>
      <h2 style="margin:20px 0 12px">Binding</h2>
      <div class="grid cols-2" style="gap:8px;margin-bottom:8px">
        <input [(ngModel)]="bd.exchange" placeholder="Exchange origen" aria-label="Exchange origen">
        <input [(ngModel)]="bd.destination" placeholder="Cola destino" aria-label="Destino">
      </div>
      <input [(ngModel)]="bd.routingKey" placeholder="Routing key" aria-label="Routing key" style="margin-bottom:8px">
      <button class="btn primary" (click)="run(api.crearBinding(bd))">Crear binding</button></section>
  </div>`,
})
export class AdminComponent {
  protected readonly api = inject(ApiService);
  protected readonly error = signal('');
  protected readonly resultado = signal('');
  cola: QueueRequest = { name: '', quorum: true, durable: true };
  ex: ExchangeRequest = { name: '', type: 'direct', durable: true };
  bd: BindingRequest = { exchange: '', destination: '', destinationType: 'queue', routingKey: '' };

  run(op: Observable<unknown>) {
    this.error.set(''); this.resultado.set('');
    op.subscribe({ next: (r) => this.resultado.set(JSON.stringify(r, null, 2)), error: (e) => this.error.set(mensajeError(e)) });
  }
}

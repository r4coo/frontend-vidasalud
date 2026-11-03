import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { ApiService, mensajeError } from '../core/api.service';
import { Box, Prestacion } from '../core/models';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [FormsModule],
  template: `
  <h1 style="margin-bottom:16px">Catálogo</h1>
  @if (error()) { <div class="alert error" role="alert" style="margin-bottom:12px">{{ error() }}</div> }
  <div class="grid cols-2">
    <section class="card">
      <h2 style="margin-bottom:12px">Prestaciones</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Nombre</th><th>Min</th><th>Activa</th><th></th></tr></thead>
        <tbody>@for (p of prestaciones(); track p.id) {
          <tr><td><b>{{ p.nombre }}</b><div class="small muted">{{ p.descripcion }}</div></td><td>{{ p.duracionMin }}</td>
            <td>{{ p.activa ? 'Sí' : 'No' }}</td>
            <td style="text-align:right">@if (admin()) {<button class="btn sm danger" (click)="borrarPrestacion(p)">Eliminar</button>}</td></tr>
        }</tbody></table></div>
      <h3 style="margin:16px 0 8px">Nueva prestación</h3>
      <form (ngSubmit)="crearPrestacion()" class="grid" style="gap:8px">
        <input name="n" required placeholder="Nombre" [(ngModel)]="np.nombre">
        <input name="d" placeholder="Descripción" [(ngModel)]="np.descripcion">
        <input name="m" type="number" min="5" required placeholder="Duración (min)" [(ngModel)]="np.duracionMin">
        <button class="btn primary">Guardar</button>
      </form>
    </section>
    <section class="card">
      <h2 style="margin-bottom:12px">Boxes</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Nombre</th><th>Activo</th><th></th></tr></thead>
        <tbody>@for (b of boxes(); track b.id) {
          <tr><td><b>{{ b.nombre }}</b></td><td>{{ b.activo ? 'Sí' : 'No' }}</td>
            <td style="text-align:right">@if (admin()) {<button class="btn sm danger" (click)="borrarBox(b)">Eliminar</button>}</td></tr>
        }</tbody></table></div>
      <h3 style="margin:16px 0 8px">Nuevo box</h3>
      <form (ngSubmit)="crearBox()" class="row">
        <input name="bn" required placeholder="Nombre del box" [(ngModel)]="nb.nombre"><button class="btn primary">Guardar</button>
      </form>
    </section>
  </div>
  <p class="small muted" style="margin-top:10px">Recepcionista y Admin crean y editan; solo Admin elimina (lo exige el BFF).</p>`,
})
export class CatalogoComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  protected readonly prestaciones = signal<Prestacion[]>([]);
  protected readonly boxes = signal<Box[]>([]);
  protected readonly error = signal('');
  np: Prestacion = { nombre: '', descripcion: '', duracionMin: 30, activa: true };
  nb: Box = { nombre: '', activo: true };

  admin() { return this.auth.hasRole('Admin'); }
  ngOnInit() { this.cargar(); }

  private fail = (e: unknown) => this.error.set(mensajeError(e));
  cargar() {
    this.error.set('');
    this.api.prestaciones().subscribe({ next: (r) => this.prestaciones.set(r), error: this.fail });
    this.api.boxes().subscribe({ next: (r) => this.boxes.set(r), error: this.fail });
  }
  crearPrestacion() {
    this.api.guardarPrestacion(this.np).subscribe({
      next: () => { this.np = { nombre: '', descripcion: '', duracionMin: 30, activa: true }; this.cargar(); }, error: this.fail });
  }
  crearBox() { this.api.guardarBox(this.nb).subscribe({ next: () => { this.nb = { nombre: '', activo: true }; this.cargar(); }, error: this.fail }); }
  borrarPrestacion(p: Prestacion) { this.api.eliminarPrestacion(p.id!).subscribe({ next: () => this.cargar(), error: this.fail }); }
  borrarBox(b: Box) { this.api.eliminarBox(b.id!).subscribe({ next: () => this.cargar(), error: this.fail }); }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { demoAtenciones, demoCupos, DEMO_BOXES, DEMO_PRESTACIONES } from './demo-data';
import {
  Atencion, AtencionRequest, BindingRequest, Box, Cupo, EstadoAtencion, ExchangeRequest, Prestacion, QueueRequest, TRANSICIONES,
} from './models';

/** Convierte errores HTTP del BFF en un mensaje legible. */
export function mensajeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const b = e.error;
    const detalle = typeof b === 'string' ? b : b?.message ?? b?.error ?? b?.detail;
    const base = e.status === 0 ? 'No se pudo contactar al servidor' :
      e.status === 401 ? 'Sesión no válida o expirada (401)' :
      e.status === 403 ? 'No tienes permiso para esta acción (403)' :
      e.status === 422 ? 'Regla de negocio no cumplida (422)' : `Error ${e.status}`;
    return detalle ? `${base}: ${detalle}` : base;
  }
  return e instanceof Error ? e.message : 'Error inesperado';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = environment.apiBaseUrl;
  private readonly demo = environment.demoMode;

  // --- estado en memoria del modo demostración ---
  private dAtenciones: Atencion[] | null = null;
  private dPrestaciones = [...DEMO_PRESTACIONES];
  private dBoxes = [...DEMO_BOXES];

  private url(p: string) { return `${this.base}${p}`; }
  private sim<T>(v: T): Observable<T> { return of(v).pipe(delay(200)); }
  private fail(status: number, message: string): Observable<never> {
    return throwError(() => new HttpErrorResponse({ status, error: { message } }));
  }

  // ---------- Atenciones ----------
  atenciones(): Observable<Atencion[]> {
    if (this.demo) {
      this.dAtenciones ??= demoAtenciones(this.auth.session()?.email ?? 'paciente@demo.cl');
      return this.sim([...this.dAtenciones]);
    }
    return this.http.get<Atencion[]>(this.url('/api/appointments'));
  }

  crearAtencion(req: AtencionRequest): Observable<Atencion> {
    if (this.demo) {
      const hoy = new Date().toISOString().slice(0, 10);
      if (req.fecha < hoy) return this.fail(422, 'No se puede agendar en una fecha pasada');
      if (new Date(req.fecha + 'T12:00:00').getDay() === 0) return this.fail(422, 'No hay atención los domingos');
      const a: Atencion = { id: crypto.randomUUID(), ...req, paciente: this.auth.session()?.email ?? 'demo', estado: 'SOLICITADA', motivo: null };
      this.dAtenciones = [a, ...(this.dAtenciones ?? demoAtenciones(a.paciente))];
      return this.sim(a);
    }
    return this.http.post<Atencion>(this.url('/api/appointments'), req);
  }

  cambiarEstado(id: string, estado: EstadoAtencion): Observable<Atencion | null> {
    if (this.demo) {
      const a = this.dAtenciones?.find((x) => x.id === id);
      if (!a) return this.fail(404, 'Atención no encontrada');
      if (!TRANSICIONES[a.estado].includes(estado)) return this.fail(422, `No se puede pasar de ${a.estado} a ${estado}`);
      if (estado === 'CONFIRMADA') {
        // Flujo asíncrono real: comando a RabbitMQ → catálogo descuenta cupo → evento → estado. Aquí se simula.
        setTimeout(() => { a.estado = 'CONFIRMADA'; }, 1200);
        return this.sim(null);
      }
      a.estado = estado;
      return this.sim({ ...a });
    }
    // 202 Accepted (CONFIRMADA, proceso asíncrono) devuelve cuerpo vacío o la atención.
    return this.http.put<Atencion | null>(this.url(`/api/appointments/${id}/estado`), { estado });
  }

  // ---------- Catálogo ----------
  prestaciones(): Observable<Prestacion[]> {
    return this.demo ? this.sim([...this.dPrestaciones]) : this.http.get<Prestacion[]>(this.url('/api/catalog/prestaciones'));
  }
  guardarPrestacion(p: Prestacion): Observable<Prestacion> {
    if (this.demo) {
      if (p.id) this.dPrestaciones = this.dPrestaciones.map((x) => (x.id === p.id ? p : x));
      else { p = { ...p, id: Date.now() }; this.dPrestaciones = [...this.dPrestaciones, p]; }
      return this.sim(p);
    }
    return p.id ? this.http.put<Prestacion>(this.url(`/api/catalog/prestaciones/${p.id}`), p)
                : this.http.post<Prestacion>(this.url('/api/catalog/prestaciones'), p);
  }
  eliminarPrestacion(id: number): Observable<void> {
    if (this.demo) { this.dPrestaciones = this.dPrestaciones.filter((x) => x.id !== id); return this.sim(undefined); }
    return this.http.delete<void>(this.url(`/api/catalog/prestaciones/${id}`));
  }
  boxes(): Observable<Box[]> {
    return this.demo ? this.sim([...this.dBoxes]) : this.http.get<Box[]>(this.url('/api/catalog/boxes'));
  }
  guardarBox(b: Box): Observable<Box> {
    if (this.demo) {
      if (b.id) this.dBoxes = this.dBoxes.map((x) => (x.id === b.id ? b : x));
      else { b = { ...b, id: Date.now() }; this.dBoxes = [...this.dBoxes, b]; }
      return this.sim(b);
    }
    return b.id ? this.http.put<Box>(this.url(`/api/catalog/boxes/${b.id}`), b) : this.http.post<Box>(this.url('/api/catalog/boxes'), b);
  }
  eliminarBox(id: number): Observable<void> {
    if (this.demo) { this.dBoxes = this.dBoxes.filter((x) => x.id !== id); return this.sim(undefined); }
    return this.http.delete<void>(this.url(`/api/catalog/boxes/${id}`));
  }
  cupos(prestacionId: number, fecha: string): Observable<Cupo[]> {
    return this.demo ? this.sim(demoCupos(prestacionId, fecha))
      : this.http.get<Cupo[]>(this.url('/api/catalog/cupos'), { params: { prestacionId, fecha } });
  }

  // ---------- Administración RabbitMQ (solo Admin) ----------
  private admin<T>(call: () => Observable<T>, demoValue: T): Observable<T> {
    return this.demo ? this.sim(demoValue) : call();
  }
  crearCola(r: QueueRequest) { return this.admin(() => this.http.post<unknown>(this.url('/api/admin/rabbit/queues'), r), { creada: r.name }); }
  infoCola(n: string) { return this.admin(() => this.http.get<unknown>(this.url(`/api/admin/rabbit/queues/${encodeURIComponent(n)}`)), { name: n, messageCount: 0, consumerCount: 1 }); }
  purgarCola(n: string) { return this.admin(() => this.http.delete<unknown>(this.url(`/api/admin/rabbit/queues/${encodeURIComponent(n)}/messages`)), { purgada: n }); }
  eliminarCola(n: string) { return this.admin(() => this.http.delete<unknown>(this.url(`/api/admin/rabbit/queues/${encodeURIComponent(n)}`)), { eliminada: n }); }
  crearExchange(r: ExchangeRequest) { return this.admin(() => this.http.post<unknown>(this.url('/api/admin/rabbit/exchanges'), r), { creado: r.name }); }
  crearBinding(r: BindingRequest) { return this.admin(() => this.http.post<unknown>(this.url('/api/admin/rabbit/bindings'), r), { binding: r }); }

  /** Sondeo de salud del BFF (público). */
  health(): Observable<boolean> {
    if (this.demo) return this.sim(true);
    return this.http.get(this.url('/api/health')).pipe(map(() => true), catchError(() => of(false)));
  }
}

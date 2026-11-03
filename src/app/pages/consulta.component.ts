import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../shared/icon.component';
import { DEMO_VITALES } from '../core/demo-data';

@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
  <div class="grid call">
    <section class="stage">
      <div class="remote"><div class="avatar big">DR</div><div>Profesional de salud</div><span class="small">{{ enLlamada() ? 'Conectado · ' + tiempo() : 'Sin llamada activa' }}</span></div>
      <video #local class="pip" autoplay muted playsinline [hidden]="!camOn()"></video>
      <div class="controls">
        <button class="ctl" (click)="toggleMic()" [attr.aria-pressed]="!micOn()" aria-label="Micrófono"><app-icon [name]="micOn() ? 'mic' : 'micoff'" /></button>
        <button class="ctl" (click)="toggleCam()" [attr.aria-pressed]="!camOn()" aria-label="Cámara"><app-icon name="cam" /></button>
        @if (!enLlamada()) { <button class="ctl go" (click)="iniciar()" aria-label="Iniciar"><app-icon name="phone" /></button> }
        @else { <button class="ctl end" (click)="terminar()" aria-label="Colgar"><app-icon name="phone" /></button> }
      </div>
    </section>
    <aside class="card">
      <h2 style="margin-bottom:12px">Datos del paciente</h2>
      <p class="small muted">Ejemplo de demostración. Las fichas clínicas aún no tienen microservicio.</p>
      @for (v of vitales; track v.label) {
        <div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span class="muted">{{ v.label }}</span>
          <b [style.color]="v.ok ? 'var(--success)' : 'var(--warning)'">{{ v.value }}</b></div>
      }
      <h3 style="margin:16px 0 8px">Notas de la consulta</h3>
      <textarea rows="5" placeholder="Escribe aquí las notas…" [(ngModel)]="notas"></textarea>
    </aside>
  </div>
  @if (error()) { <div class="alert error" role="alert" style="margin-top:12px">{{ error() }}</div> }
  <p class="small muted" style="margin-top:10px">La videollamada real entre dos personas necesitaría un servicio de señalización/WebRTC (fuera del alcance de las guías); aquí se muestra tu cámara local.</p>`,
  styles: [`.call{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}@media(max-width:900px){.call{grid-template-columns:1fr}}
  .stage{position:relative;background:var(--call);color:#fff;border-radius:16px;min-height:420px;display:grid;place-items:center;overflow:hidden}
  .remote{display:grid;gap:8px;place-items:center;opacity:.9}.big{width:84px;height:84px;font-size:26px}
  .pip{position:absolute;right:16px;top:16px;width:160px;aspect-ratio:4/3;object-fit:cover;border-radius:12px;border:2px solid #ffffff55;background:#000}
  .controls{position:absolute;bottom:18px;left:0;right:0;display:flex;justify-content:center;gap:14px}
  .ctl{width:48px;height:48px;border-radius:50%;border:0;background:#ffffff26;color:#fff;display:grid;place-items:center}
  .ctl[aria-pressed=true]{background:#fff;color:var(--call)}.go{background:var(--success)}.end{background:var(--danger)}`],
})
export class ConsultaComponent implements OnDestroy {
  @ViewChild('local') local?: ElementRef<HTMLVideoElement>;
  protected readonly vitales = DEMO_VITALES;
  protected readonly enLlamada = signal(false);
  protected readonly micOn = signal(true);
  protected readonly camOn = signal(true);
  protected readonly tiempo = signal('00:00');
  protected readonly error = signal('');
  notas = '';
  private stream?: MediaStream;
  private timer?: ReturnType<typeof setInterval>;

  async iniciar() {
    this.error.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.local!.nativeElement.srcObject = this.stream;
      this.enLlamada.set(true); this.micOn.set(true); this.camOn.set(true);
      const t0 = Date.now();
      this.timer = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        this.tiempo.set(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
      }, 1000);
    } catch {
      this.error.set('No se pudo acceder a la cámara/micrófono. Revisa los permisos del navegador (se requiere HTTPS o localhost).');
    }
  }
  toggleMic() { this.micOn.update((v) => !v); this.stream?.getAudioTracks().forEach((t) => (t.enabled = this.micOn())); }
  toggleCam() { this.camOn.update((v) => !v); this.stream?.getVideoTracks().forEach((t) => (t.enabled = this.camOn())); }
  terminar() {
    this.stream?.getTracks().forEach((t) => t.stop()); this.stream = undefined;
    clearInterval(this.timer); this.enLlamada.set(false); this.tiempo.set('00:00');
  }
  ngOnDestroy() { this.terminar(); }
}

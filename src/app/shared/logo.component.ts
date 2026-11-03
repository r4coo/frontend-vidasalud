import { Component } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [IconComponent],
  template: `<span class="logo"><span class="mark"><app-icon name="stetho" [size]="18"/></span><b>Vida<span>Salud</span></b></span>`,
  styles: [`.logo{display:inline-flex;align-items:center;gap:10px;font-size:18px;letter-spacing:-.02em}
  .mark{width:34px;height:34px;border-radius:10px;background:var(--primary);color:#fff;display:grid;place-items:center}
  b span{color:var(--primary)}`],
})
export class LogoComponent {}

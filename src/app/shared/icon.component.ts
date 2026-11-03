import { Component, Input } from '@angular/core';

const PATHS: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  plus: 'M12 5v14M5 12h14',
  video: 'M3 7h12v10H3zM15 11l6-3v8l-6-3',
  file: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  mic: 'M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v4',
  micoff: 'M3 3l18 18M9 9v3a3 3 0 005 2M15 9V6a3 3 0 00-6 0M6 11a6 6 0 009 5M12 17v4',
  cam: 'M3 7h12v10H3zM15 11l6-3v8l-6-3M3 3l18 18',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  stetho: 'M6 3v6a4 4 0 008 0V3M10 13v2a5 5 0 0010 0v-2M20 11a2 2 0 100 4',
  check: 'M5 12l5 5 9-10',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="d"/></svg>`,
  styles: [':host{display:inline-flex}'],
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() size = 18;
  get d() { return PATHS[this.name] ?? ''; }
}

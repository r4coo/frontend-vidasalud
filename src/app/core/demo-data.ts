import { Atencion, Box, Cupo, Prestacion } from './models';

export const DEMO_PRESTACIONES: Prestacion[] = [
  { id: 1, nombre: 'Medicina general', descripcion: 'Consulta médica general', duracionMin: 30, activa: true },
  { id: 2, nombre: 'Pediatría', descripcion: 'Control infantil', duracionMin: 30, activa: true },
  { id: 3, nombre: 'Cardiología', descripcion: 'Evaluación cardiovascular', duracionMin: 45, activa: true },
  { id: 4, nombre: 'Ginecología', descripcion: 'Control ginecológico', duracionMin: 30, activa: true },
  { id: 5, nombre: 'Salud mental', descripcion: 'Atención psicológica', duracionMin: 50, activa: true },
  { id: 6, nombre: 'Dermatología', descripcion: 'Evaluación de la piel', duracionMin: 30, activa: true },
];
export const DEMO_BOXES: Box[] = [
  { id: 1, nombre: 'Box 1', activo: true }, { id: 2, nombre: 'Box 2', activo: true },
  { id: 3, nombre: 'Box 3', activo: true }, { id: 4, nombre: 'Box telemedicina', activo: true },
];
const HORAS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'];
export function demoCupos(prestacionId: number, fecha: string): Cupo[] {
  return HORAS.map((hora, i) => ({ id: prestacionId * 1000 + i, prestacionId, boxId: (i % 4) + 1, fecha, hora, disponibles: i % 5 === 4 ? 0 : 1 + (i % 3) }));
}
export function demoAtenciones(paciente: string): Atencion[] {
  const hoy = new Date(); const f = (d: number) => { const x = new Date(hoy); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
  return [
    { id: 'a1', prestacionId: 1, prestacion: 'Medicina general', fecha: f(1), hora: '10:00', paciente, estado: 'CONFIRMADA', motivo: null },
    { id: 'a2', prestacionId: 3, prestacion: 'Cardiología', fecha: f(3), hora: '09:30', paciente, estado: 'SOLICITADA', motivo: null },
    { id: 'a3', prestacionId: 5, prestacion: 'Salud mental', fecha: f(-14), hora: '15:00', paciente, estado: 'CERRADA', motivo: null },
  ];
}
// Historial clínico de demostración (no existe aún un microservicio de fichas clínicas).
export const DEMO_HISTORIAL = [
  { fecha: '15 abr 2025', tipo: 'Medicina general', profesional: 'Dra. Valentina Torres', nota: 'Control de hipertensión. PA 128/82. Se mantiene tratamiento.' },
  { fecha: '02 feb 2025', tipo: 'Cardiología', profesional: 'Dr. Matías Herrera', nota: 'ECG normal. Se sugiere control en 6 meses.' },
  { fecha: '18 nov 2024', tipo: 'Salud mental', profesional: 'Dra. Isidora Vega', nota: 'Seguimiento mensual, evolución favorable.' },
];
export const DEMO_VITALES = [
  { label: 'Presión arterial', value: '128/82 mmHg', ok: true },
  { label: 'Glicemia', value: '112 mg/dL', ok: false },
  { label: 'Peso', value: '78 kg', ok: true },
  { label: 'Saturación O₂', value: '97 %', ok: true },
];

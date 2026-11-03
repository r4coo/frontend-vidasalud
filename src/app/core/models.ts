export type Role = 'Admin' | 'Recepcionista' | 'Paciente';
export const ROLES: Role[] = ['Admin', 'Recepcionista', 'Paciente'];

export type EstadoAtencion = 'SOLICITADA' | 'CONFIRMADA' | 'EN_ESPERA' | 'EN_ATENCION' | 'CERRADA' | 'CANCELADA';

/** Mismas transiciones que EstadoAtencion.puedePasarA en el backend (el backend es quien manda). */
export const TRANSICIONES: Record<EstadoAtencion, EstadoAtencion[]> = {
  SOLICITADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_ESPERA', 'CANCELADA'],
  EN_ESPERA: ['EN_ATENCION', 'CANCELADA'],
  EN_ATENCION: ['CERRADA'],
  CERRADA: [],
  CANCELADA: [],
};

export interface Atencion {
  id: string;
  prestacionId: number;
  prestacion: string;
  fecha: string; // yyyy-MM-dd
  hora: string; // HH:mm
  paciente: string;
  estado: EstadoAtencion;
  motivo: string | null;
}
export interface AtencionRequest { prestacionId: number; prestacion: string; fecha: string; hora: string }

export interface Prestacion { id?: number; nombre: string; descripcion: string; duracionMin: number; activa: boolean }
export interface Box { id?: number; nombre: string; activo: boolean }
export interface Cupo { id?: number; prestacionId: number; boxId: number; fecha: string; hora: string; disponibles: number }

export interface QueueRequest { name: string; durable?: boolean; quorum?: boolean; deadLetterExchange?: string; deadLetterRoutingKey?: string }
export interface ExchangeRequest { name: string; type: 'direct' | 'topic' | 'fanout' | 'headers'; durable?: boolean }
export interface BindingRequest { exchange: string; destination: string; destinationType: 'queue' | 'exchange'; routingKey: string }

export interface Session { name: string; email: string; roles: Role[] }

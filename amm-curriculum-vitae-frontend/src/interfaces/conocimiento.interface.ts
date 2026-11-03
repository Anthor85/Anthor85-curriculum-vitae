import { TextoLocalizado } from './idioma.interface';

export enum ConocimientoPrioridad {
  MUY_ALTA = 'muyAlta',
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
  MUY_BAJA = 'muyBaja',
}

// Solo admin
export const ETIQUETAS_PRIORIDAD: Record<ConocimientoPrioridad, string> = {
  muyAlta: 'Muy alta',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  muyBaja: 'Muy baja',
};

export interface Conocimiento<T = TextoLocalizado> {
  id: string;
  titulo: T;
  prioridad: ConocimientoPrioridad;
}

export type ConocimientoPayload = Omit<Conocimiento, 'id'>;

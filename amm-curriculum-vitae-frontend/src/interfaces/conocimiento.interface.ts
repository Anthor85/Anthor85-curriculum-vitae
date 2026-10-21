export enum ConocimientoPrioridad {
  MUY_ALTA = 'Muy alta',
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja',
  MUY_BAJA = 'Muy baja',
}

export enum ConocimientoPrioridad {
  MUY_ALTA = 'Muy alta',
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja',
  MUY_BAJA = 'Muy baja'
}

export interface Conocimiento {
  id: string;
  titulo: string;
  prioridad: ConocimientoPrioridad;
}

export type ConocimientoPayload = Omit<Conocimiento, 'id'>;

export enum ConocimientoNivel {
  BASICO = 'Básico',
  INTERMEDIO = 'Intermedio',
  AVANZADO = 'Avanzado',
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
  nivel: ConocimientoNivel;
}

export type ConocimientoPayload = Omit<Conocimiento, 'id'>;

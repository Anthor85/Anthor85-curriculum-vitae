export enum ConocimientoNivel {
  BASICO = 'Básico',
  INTERMEDIO = 'Intermedio',
  AVANZADO = 'Avanzado',
}

export interface Conocimiento {
  id: string;
  titulo: string;
  nivel: ConocimientoNivel;
}

export type ConocimientoPayload = Omit<Conocimiento, 'id'>;

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

export interface ConocimientoPayload extends Omit<Conocimiento, 'id'> {}

export interface ConocimientoState {
  conocimiento: Conocimiento[];
  loading: boolean;
  error: string | null;
}

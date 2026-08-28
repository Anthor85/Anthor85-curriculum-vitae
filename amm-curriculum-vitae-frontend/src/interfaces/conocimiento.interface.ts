export enum ConocimientoNivel {
  BASICO = "basico",
  INTERMEDIO = "intermedio",
  AVANZADO = "avanzado",
}

export interface Conocimiento {
  id: string;
  titulo: string;
  nivel: ConocimientoNivel;
}

export interface ConocimientoState {
  conocimiento: Conocimiento[];
  loading: boolean;
  error: string | null;
}

export interface ConocimientoAction {
  type: string;
  payload: any;
}

export type ConocimientoDispatch = (action: ConocimientoAction) => void;

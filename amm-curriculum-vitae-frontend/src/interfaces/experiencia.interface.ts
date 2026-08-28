export interface Experiencia {
  id: string;
  empresa: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string;
  tecnologias: string[];
}

export interface ExperienciaState {
  experiencia: Experiencia[];
  loading: boolean;
  error: string | null;
}

export interface ExperienciaAction {
  type: string;
  payload: any;
}

export type ExperienciaDispatch = (action: ExperienciaAction) => void;

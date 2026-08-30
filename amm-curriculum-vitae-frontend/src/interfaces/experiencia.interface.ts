export interface Hito {
  id: string;
  descripcion: string;
  experiencia: string;
}

export interface Experiencia {
  id: string;
  empresa: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string;
  tecnologias: string[];
  hitos: Hito[];
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

export interface HitoForm {
  id?: string;
  descripcion: string;
}

export interface ExperienciaPayload {
  empresa: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  tecnologias: string[];
  hitos: HitoForm[];
}

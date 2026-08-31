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

export interface ExperienciaPayload extends Omit<Experiencia, 'id'> {}

export interface ExperienciaState {
  experiencia: Experiencia[] | null;
  loading: boolean;
  error: string | null;
}

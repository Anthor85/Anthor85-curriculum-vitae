import { TextoLocalizado } from './idioma.interface';

export interface Hito<T = TextoLocalizado> {
  id: string;
  descripcion: T;
  experiencia: string;
}

export interface HitoPayload {
  id?: string;
  descripcion: TextoLocalizado;
}

export interface Experiencia<T = TextoLocalizado> {
  id: string;
  empresa: string;
  descripcion: T;
  fechaInicio: string;
  fechaFin?: string;
  tecnologias: string[];
  hitos: Hito<T>[];
}

export interface ExperienciaPayload extends Omit<Experiencia, 'id' | 'hitos'> {
  hitos: HitoPayload[];
}

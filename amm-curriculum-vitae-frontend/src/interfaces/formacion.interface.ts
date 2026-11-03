import { TextoLocalizado } from './idioma.interface';

export interface Extra<T = TextoLocalizado> {
  id: string;
  descripcion: T;
  formacion: string;
}

export interface ExtraPayload {
  id?: string;
  descripcion: TextoLocalizado;
}

export interface Formacion<T = TextoLocalizado> {
  id: string;
  titulo: T;
  institucion: T;
  fechaFin: string;
  extras: Extra<T>[];
}

export interface FormacionPayload extends Omit<Formacion, 'id' | 'extras'> {
  extras: ExtraPayload[];
}

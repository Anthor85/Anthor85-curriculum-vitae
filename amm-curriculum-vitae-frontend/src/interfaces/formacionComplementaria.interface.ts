import { TextoLocalizado } from './idioma.interface';

export interface FormacionComplementaria<T = TextoLocalizado> {
  id: string;
  titulo: T;
  institucion: T;
  fechaFin?: string;
}

export type FormacionComplementariaPayload = Omit<
  FormacionComplementaria,
  'id'
>;

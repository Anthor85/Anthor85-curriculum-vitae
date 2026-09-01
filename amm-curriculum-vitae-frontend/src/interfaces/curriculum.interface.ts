import { Conocimiento } from './conocimiento.interface';
import { Experiencia } from './experiencia.interface';
import { Formacion } from './formacion.interface';
import { FormacionComplementaria } from './formacionComplementaria.interface';
import { Perfil } from './perfil.interface';

export interface Curriculum {
  conocimiento: Conocimiento[];
  experiencia: Experiencia[];
  formaciones: Formacion[];
  formacionesComplementarias: FormacionComplementaria[];
  perfil: Perfil | null;
}

export interface CurriculumState {
  curriculum: Curriculum | null;
  loading: boolean;
  error: string | null;
}
export interface CurriculumAction {
  type: string;
  payload?: any;
}
export type CurriculumDispatch = (action: CurriculumAction) => void;

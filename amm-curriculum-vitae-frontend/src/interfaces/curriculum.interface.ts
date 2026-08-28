import { Conocimiento } from './conocimiento.interface';
import { Experiencia } from './experiencia.interface';
import { Formacion } from './formacion.interface';
import { FormacionComplementaria } from './formacionComplementaria.interface';

export interface CurriculumState {
  conocimiento: Conocimiento[];
  experiencia: Experiencia[];
  formacion: Formacion[];
  formacionComplementaria: FormacionComplementaria[];
  perfil: any; //TODO: CAMBIAR A UN TIPO DEFINIDO
  loading: boolean;
  error: string | null;
}
export interface CurriculumAction {
  type: string;
  payload?: any;
}
export type CurriculumDispatch = (action: CurriculumAction) => void;

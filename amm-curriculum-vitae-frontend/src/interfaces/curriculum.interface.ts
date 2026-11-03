import { Conocimiento } from './conocimiento.interface';
import { Experiencia } from './experiencia.interface';
import { Formacion } from './formacion.interface';
import { FormacionComplementaria } from './formacionComplementaria.interface';
import { Perfil } from './perfil.interface';

// Lo que devuelve /curriculum?lang=: los textos ya vienen resueltos.
export interface Curriculum {
  conocimiento: Conocimiento[];
  experiencia: Experiencia<string>[];
  formaciones: Formacion<string>[];
  formacionesComplementarias: FormacionComplementaria<string>[];
  perfil: Perfil<string> | null;
}

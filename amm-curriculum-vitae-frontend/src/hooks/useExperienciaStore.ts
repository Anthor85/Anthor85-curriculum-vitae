import type {
  Experiencia,
  ExperienciaPayload,
} from '../interfaces/experiencia.interface';
import { setExperiencia } from '../store';
import { crearCrudStore } from '../helpers/crearCrudStore';

export const useExperienciaStore = crearCrudStore<
  Experiencia,
  ExperienciaPayload
>()('experiencia', setExperiencia, (state) => state.experiencia);

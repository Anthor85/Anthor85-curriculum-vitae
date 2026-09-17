import type {
  Experiencia,
  ExperienciaPayload,
} from '../interfaces/experiencia.interface';
import {
  setErrorExperiencia,
  setExperiencia,
  setLoadingExperiencia,
} from '../store';
import { crearCrudStore } from '../helpers/crearCrudStore';

export const useExperienciaStore = crearCrudStore<
  Experiencia,
  ExperienciaPayload
>()(
  'experiencia',
  setExperiencia,
  setLoadingExperiencia,
  setErrorExperiencia,
  (state) => state.experiencia,
);

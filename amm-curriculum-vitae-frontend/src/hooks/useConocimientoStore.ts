import type {
  Conocimiento,
  ConocimientoPayload,
} from '../interfaces/conocimiento.interface';
import {
  setConocimiento,
  setErrorConocimiento,
  setLoadingConocimiento,
} from '../store';
import { crearCrudStore } from '../helpers/crearCrudStore';

export const useConocimientoStore = crearCrudStore<
  Conocimiento,
  ConocimientoPayload
>()(
  'conocimiento',
  setConocimiento,
  setLoadingConocimiento,
  setErrorConocimiento,
  (state) => state.conocimiento,
);

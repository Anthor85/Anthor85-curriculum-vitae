import type {
  Conocimiento,
  ConocimientoPayload,
} from '../interfaces/conocimiento.interface';
import { setConocimiento } from '../store';
import { crearCrudStore } from '../helpers/crearCrudStore';

export const useConocimientoStore = crearCrudStore<
  Conocimiento,
  ConocimientoPayload
>()('conocimiento', setConocimiento, (state) => state.conocimiento);

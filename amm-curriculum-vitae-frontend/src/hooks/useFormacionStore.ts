import { setFormacion } from '../store';
import type {
  Formacion,
  FormacionPayload,
} from '../interfaces/formacion.interface';
import { crearCrudStore } from '../helpers/crearCrudStore';

export const useFormacionStore = crearCrudStore<Formacion, FormacionPayload>()(
  'formacion',
  setFormacion,
  (state) => state.formacion,
);

import { setFormacionComplementaria } from '../store';
import type {
  FormacionComplementaria,
  FormacionComplementariaPayload,
} from '../interfaces/formacionComplementaria.interface';
import { crearCrudStore } from '../helpers/crearCrudStore';

export const useFormacionComplementariaStore = crearCrudStore<
  FormacionComplementaria,
  FormacionComplementariaPayload
>()(
  'formacionComplementaria',
  setFormacionComplementaria,
  (state) => state.formacionComplementaria,
);

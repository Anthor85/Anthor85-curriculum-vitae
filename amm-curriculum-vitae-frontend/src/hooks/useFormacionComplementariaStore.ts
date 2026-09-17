import {
  setErrorFormacionComplementaria,
  setFormacionComplementaria,
  setLoadingFormacionComplementaria,
} from '../store';
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
  setLoadingFormacionComplementaria,
  setErrorFormacionComplementaria,
  (state) => state.formacionComplementaria,
);

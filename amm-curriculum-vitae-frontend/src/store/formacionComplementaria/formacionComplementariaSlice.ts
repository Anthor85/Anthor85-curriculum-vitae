import { FormacionComplementaria } from '../../interfaces/formacionComplementaria.interface';
import { crearSliceCrud } from '../../helpers/crearSliceCrud';

export const formacionComplementariaSlice =
  crearSliceCrud<FormacionComplementaria[]>()('formacionComplementaria');
export const {
  setFormacionComplementaria,
  setLoadingFormacionComplementaria,
  setErrorFormacionComplementaria,
} = formacionComplementariaSlice.actions;

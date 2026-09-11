import { Formacion } from '../../interfaces/formacion.interface';
import { crearSliceCrud } from '../../helpers/crearSliceCrud';

export const formacionSlice = crearSliceCrud<Formacion[]>()('formacion');
export const { setFormacion, setLoadingFormacion, setErrorFormacion } =
  formacionSlice.actions;

import { Experiencia } from '../../interfaces/experiencia.interface';
import { crearSliceCrud } from '../../helpers/crearSliceCrud';

export const experienciaSlice = crearSliceCrud<Experiencia[]>()('experiencia');
export const { setExperiencia, setLoadingExperiencia, setErrorExperiencia } =
  experienciaSlice.actions;

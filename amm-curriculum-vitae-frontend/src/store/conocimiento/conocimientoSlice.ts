import { Conocimiento } from '../../interfaces/conocimiento.interface';
import { crearSliceCrud } from '../../helpers/crearSliceCrud';

export const conocimientoSlice = crearSliceCrud<Conocimiento[]>()('conocimiento');
export const { setConocimiento, setLoadingConocimiento, setErrorConocimiento } =
  conocimientoSlice.actions;

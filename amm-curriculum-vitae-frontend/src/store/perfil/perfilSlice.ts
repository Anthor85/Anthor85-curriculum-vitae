import { Perfil } from '../../interfaces/perfil.interface';
import { crearSliceCrud } from '../../helpers/crearSliceCrud';

export const perfilSlice = crearSliceCrud<Perfil>()('perfil');
export const { setErrorPerfil, setLoadingPerfil, setPerfil } =
  perfilSlice.actions;

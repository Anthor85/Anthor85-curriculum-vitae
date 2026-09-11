import { Curriculum } from '../../interfaces/curriculum.interface';
import { crearSliceCrud } from '../../helpers/crearSliceCrud';

export const curriculumSlice = crearSliceCrud<Curriculum>()('curriculum');
export const { setCurriculum, setLoadingCurriculum, setErrorCurriculum } =
  curriculumSlice.actions;

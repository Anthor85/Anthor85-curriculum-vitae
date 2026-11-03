import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Curriculum } from '../../interfaces/curriculum.interface';
import type { Idioma } from '../../interfaces/idioma.interface';

// Un currículum por idioma: volver a un idioma ya cargado no repite la petición.
export interface CurriculumState {
  curriculums: Record<Idioma, Curriculum | null>;
  loading: boolean;
  error: string | null;
}

const initialState: CurriculumState = {
  curriculums: { es: null, en: null },
  loading: false,
  error: null,
};

export const curriculumSlice = createSlice({
  name: 'curriculumSlice',
  initialState,
  reducers: {
    setCurriculum: (
      state,
      action: PayloadAction<{ idioma: Idioma; curriculum: Curriculum }>,
    ) => {
      state.curriculums[action.payload.idioma] = action.payload.curriculum;
      state.loading = false;
      state.error = null;
    },
    setLoadingCurriculum: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setErrorCurriculum: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCurriculum, setLoadingCurriculum, setErrorCurriculum } =
  curriculumSlice.actions;

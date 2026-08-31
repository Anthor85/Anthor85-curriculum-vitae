import { createSlice } from '@reduxjs/toolkit';
import { CurriculumState } from '../../interfaces/curriculum.interface';

export const slice = createSlice({
  name: 'curriculum',
  initialState: {
    conocimiento: [],
    experiencia: [],
    formaciones: [],
    formacionesComplementarias: [],
    perfil: null,
    loading: false,
    error: null,
  } as CurriculumState,
  reducers: {
    // getTecnologias: (state) => {
    //   state.loading = true;
    //   state.error = null;
    // },
    // setTecnologias: (state, action) => {
    //   state.tecnologias = action.payload;
    // },
    // setConocimiento: (state, action) => {
    //   state.curriculum = {
    //     ...state.curriculum,
    //     conocimiento: action.payload,
    //   };
    // },
    setCurriculum: (state, action) => {
      state.curriculum = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCurriculum, setLoading, setError } = slice.actions;

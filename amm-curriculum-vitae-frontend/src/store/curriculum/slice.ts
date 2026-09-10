import { createSlice } from '@reduxjs/toolkit';
import { CurriculumState } from '../../interfaces/curriculum.interface';

export const curriculumSlice = createSlice({
  name: 'curriculum',
  initialState: {
    curriculum: null,
    loading: false,
    error: null,
  } as CurriculumState,
  reducers: {
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

export const { setCurriculum, setLoading, setError } = curriculumSlice.actions;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Formacion,
  FormacionState,
} from '../../interfaces/formacion.interface';

export const formacionSlice = createSlice({
  name: 'formacionSlice',
  initialState: {
    formacion: null,
    loading: false,
    error: null,
  } as FormacionState,
  reducers: {
    setFormacion: (state, action: PayloadAction<Formacion[]>) => {
      state.formacion = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoadingFormacion: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setErrorFormacion: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setFormacion, setLoadingFormacion, setErrorFormacion } =
  formacionSlice.actions;

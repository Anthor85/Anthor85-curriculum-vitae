import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Perfil, PerfilState } from '../../interfaces/perfil.interface';

export const perfilSlice = createSlice({
  name: 'perfilSlice',
  initialState: {
    perfil: null,
    loading: false,
    error: null,
  } as PerfilState,
  reducers: {
    setPerfil: (state, action: PayloadAction<Perfil>) => {
      state.perfil = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoadingPerfil: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setErrorPerfil: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setErrorPerfil, setLoadingPerfil, setPerfil } =
  perfilSlice.actions;

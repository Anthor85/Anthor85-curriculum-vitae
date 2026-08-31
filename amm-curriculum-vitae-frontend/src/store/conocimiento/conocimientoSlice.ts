import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Conocimiento,
  ConocimientoState,
} from '../../interfaces/conocimiento.interface';

export const conocimientoSlice = createSlice({
  name: 'conocimientoSlice',
  initialState: {
    conocimiento: [],
    loading: false,
    error: null,
  } as ConocimientoState,
  reducers: {
    setConocimiento: (state, action: PayloadAction<Conocimiento[]>) => {
      state.conocimiento = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoadingConocimiento: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setErrorConocimiento: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setConocimiento, setLoadingConocimiento, setErrorConocimiento } =
  conocimientoSlice.actions;

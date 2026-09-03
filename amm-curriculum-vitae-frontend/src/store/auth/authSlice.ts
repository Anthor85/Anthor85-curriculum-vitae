import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, Usuario } from '../../interfaces/auth.interface';

export const authSlice = createSlice({
  name: 'authSlice',
  initialState: {
    status: 'checking',
    user: null,
    errorMessage: null,
  } as AuthState,
  reducers: {
    onChecking: (state) => {
      state.status = 'checking';
      state.user = null;
      state.errorMessage = null;
    },
    onLogin: (state, action: PayloadAction<Usuario>) => {
      state.status = 'authenticated';
      state.user = action.payload;
      state.errorMessage = null;
    },
    onLogout: (state, action: PayloadAction<string | null>) => {
      state.status = 'not-authenticated';
      state.user = null;
      state.errorMessage = action.payload;
    },
  },
});

export const { onChecking, onLogin, onLogout } = authSlice.actions;

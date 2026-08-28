import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Experiencia,
  ExperienciaState,
} from "../../interfaces/experiencia.interface";

export const experienciaSlice = createSlice({
  name: "experienciaSlice",
  initialState: {
    experiencia: null,
    loading: false,
    error: null,
  } as ExperienciaState,
  reducers: {
    setExperiencia: (state, action: PayloadAction<Experiencia[]>) => {
      state.experiencia = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoadingExperiencia: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setErrorExperiencia: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setExperiencia, setLoadingExperiencia, setErrorExperiencia } =
  experienciaSlice.actions;


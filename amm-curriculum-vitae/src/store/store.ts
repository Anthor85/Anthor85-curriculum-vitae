import { configureStore } from "@reduxjs/toolkit";
import { slice } from "./curriculum/slice";
import { experienciaSlice } from "./experiencia/experienciaSlice";
import { conocimientoSlice } from "./conocimiento/conocimientoSlice";
import { formacionSlice } from "./formacion/formacionSlice";
import { formacionComplementariaSlice } from "./formacionComplementaria/formacionComplementariaSlice";
import { perfilSlice } from "./perfil/perfilSlice";

export const store = configureStore({
  reducer: {
    curriculum: slice.reducer,
    conocimiento: conocimientoSlice.reducer,
    experiencia: experienciaSlice.reducer,
    formacion: formacionSlice.reducer,
    formacionComplementaria: formacionComplementariaSlice.reducer,
    perfil: perfilSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

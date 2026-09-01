import { ReactElement } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

import { slice } from '../../src/store/curriculum/slice';
import { conocimientoSlice } from '../../src/store/conocimiento/conocimientoSlice';
import { experienciaSlice } from '../../src/store/experiencia/experienciaSlice';
import { formacionSlice } from '../../src/store/formacion/formacionSlice';
import { formacionComplementariaSlice } from '../../src/store/formacionComplementaria/formacionComplementariaSlice';
import { perfilSlice } from '../../src/store/perfil/perfilSlice';

// Store nuevo por test: el `store` de src/store/store.ts es un singleton y
// filtraria estado entre tests, haciendolos dependientes del orden.
type EstadoPrecargado = Record<string, unknown>;

export const crearStore = (preloadedState?: EstadoPrecargado) =>
  configureStore({
    preloadedState,
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

export const renderConStore = (
  ui: ReactElement,
  preloadedState?: EstadoPrecargado,
) => {
  const store = crearStore(preloadedState);

  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>),
  };
};

import { createRoot, hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import api from './api/api';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { Curriculum } from './interfaces/curriculum.interface';
import { Router } from './router/Router';
import { setCurriculum, store } from './store';

import './styles/styles.css';

const contenedor = document.getElementById('root') as HTMLElement;

// El prerender deja el currículum del build en la página: con él en el store
// el primer render coincide con el HTML servido y no aparece el spinner.
const precargado = window.__CURRICULUM__;
if (precargado) store.dispatch(setCurriculum(precargado));

const app = (
  <ErrorBoundary>
    <Provider store={store}>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </Provider>
  </ErrorBoundary>
);

// Solo "/" está prerenderizada. `vite preview` sirve index.html en cualquier
// ruta y no lee vercel.json, así que la ruta se comprueba también aquí.
const hidratar =
  !!precargado &&
  window.location.pathname === '/' &&
  contenedor.hasChildNodes();

if (hidratar) {
  hydrateRoot(contenedor, app);

  // Los datos del build pueden estar viejos: se refrescan una vez en segundo
  // plano, sin `getCurriculum` (activaría el spinner). Si falla, se queda lo
  // prerenderizado.
  api
    .get<Curriculum>('/curriculum')
    .then(({ data }) => store.dispatch(setCurriculum(data)))
    .catch(() => {});
} else {
  createRoot(contenedor).render(app);
}

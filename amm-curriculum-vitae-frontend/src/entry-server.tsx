import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import type { Curriculum } from './interfaces/curriculum.interface';
import { Router } from './router/Router';
import { setCurriculum, store } from './store';

// Mismo árbol que index.tsx, con el store ya cargado y el router fijo en "/".
// El store es un singleton: un solo render por proceso.
export const render = (curriculum: Curriculum): string => {
  store.dispatch(setCurriculum(curriculum));

  return renderToString(
    <ErrorBoundary>
      <Provider store={store}>
        <StaticRouter location="/">
          <Router />
        </StaticRouter>
      </Provider>
    </ErrorBoundary>,
  );
};

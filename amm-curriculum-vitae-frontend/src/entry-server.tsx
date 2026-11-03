import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import i18n from './i18n';
import type { Curriculum } from './interfaces/curriculum.interface';
import type { Idioma } from './interfaces/idioma.interface';
import { Router } from './router/Router';
import { setCurriculum, store } from './store';

// El script de prerender no puede importar TypeScript: le llega por aquí.
export { metasCurriculum } from './helpers/metasCurriculum';

// Mismo árbol que index.tsx, con el store ya cargado y el router fijo en la
// ruta del idioma. Los dos renders van seguidos en el mismo proceso: como
// renderToString es síncrono, el singleton del store y el idioma de i18n no
// se pisan entre ellos.
export const render = (curriculum: Curriculum, idioma: Idioma): string => {
  i18n.changeLanguage(idioma);
  store.dispatch(setCurriculum({ idioma, curriculum }));

  return renderToString(
    <ErrorBoundary>
      <Provider store={store}>
        <StaticRouter location={idioma === 'en' ? '/en' : '/'}>
          <Router />
        </StaticRouter>
      </Provider>
    </ErrorBoundary>,
  );
};

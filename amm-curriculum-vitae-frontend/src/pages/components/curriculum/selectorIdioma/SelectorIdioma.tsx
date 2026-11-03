import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useIdioma } from '../../../../hooks/useIdioma';
import type { Idioma } from '../../../../interfaces/idioma.interface';

import styles from './SelectorIdioma.module.scss';

// Nombre de cada idioma en su propio idioma: no se traduce.
const OPCIONES: { idioma: Idioma; ruta: string; nombre: string }[] = [
  { idioma: 'es', ruta: '/', nombre: 'Español' },
  { idioma: 'en', ruta: '/en', nombre: 'English' },
];

// Enlaces y no botones: los rastreadores siguen las dos versiones.
export const SelectorIdioma = () => {
  const { t } = useTranslation();
  const activo = useIdioma();

  return (
    <nav className={styles.SelectorIdioma} aria-label={t('idioma.selector')}>
      {OPCIONES.map(({ idioma, ruta, nombre }) => (
        <Link
          key={idioma}
          to={ruta}
          hrefLang={idioma}
          lang={idioma}
          aria-label={nombre}
          aria-current={idioma === activo ? 'page' : undefined}
          className={styles.opcion}
        >
          {idioma.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
};

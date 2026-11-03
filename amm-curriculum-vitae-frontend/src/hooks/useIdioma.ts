import { useLocation } from 'react-router-dom';

import type { Idioma } from '../interfaces/idioma.interface';

// El idioma lo marca solo la URL: "/en" y lo que cuelgue de ella es inglés.
export const idiomaDeRuta = (pathname: string): Idioma =>
  pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'es';

export const useIdioma = (): Idioma => idiomaDeRuta(useLocation().pathname);

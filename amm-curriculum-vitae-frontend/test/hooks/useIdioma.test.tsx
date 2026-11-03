import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { idiomaDeRuta, useIdioma } from '../../src/hooks/useIdioma';

const idiomaEn = (ruta: string) =>
  renderHook(useIdioma, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[ruta]}>{children}</MemoryRouter>
    ),
  }).result.current;

describe('useIdioma', () => {
  test.each([
    ['/', 'es'],
    ['/en', 'en'],
    ['/en/', 'en'],
    ['/experiencia', 'es'],
    ['/english', 'es'],
  ])('%s → %s', (ruta, idioma) => {
    expect(idiomaEn(ruta)).toBe(idioma);
    expect(idiomaDeRuta(ruta)).toBe(idioma);
  });
});

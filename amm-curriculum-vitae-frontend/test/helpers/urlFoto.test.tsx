import { urlFoto } from '../../src/helpers/urlFoto';

const DIRECTA = 'https://lh3.googleusercontent.com/d/1R9u_Yxt-7=w1000';

describe('urlFoto', () => {
  test.each([
    'https://drive.google.com/thumbnail?id=1R9u_Yxt-7&sz=w1000',
    'https://drive.google.com/thumbnail?sz=w1000&id=1R9u_Yxt-7',
    'https://drive.google.com/uc?export=view&id=1R9u_Yxt-7',
    'https://drive.google.com/open?id=1R9u_Yxt-7',
    'https://drive.google.com/file/d/1R9u_Yxt-7/view?usp=sharing',
  ])('convierte %s en la URL directa de la imagen', (url) => {
    expect(urlFoto(url)).toBe(DIRECTA);
  });

  test.each([
    'https://example.com/foto.jpg',
    '/references/foto.jpg',
    DIRECTA,
    '',
  ])('deja %s como está', (url) => {
    expect(urlFoto(url)).toBe(url);
  });
});

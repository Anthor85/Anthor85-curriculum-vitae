/* global describe, it, expect */
const { resolverIdioma } = require('../../helpers/resolverIdioma');

describe('resolverIdioma', () => {
  const texto = { es: 'Hola', en: 'Hello' };

  it('con en devuelve el texto en ingles y con es el texto en espanol', () => {
    expect(resolverIdioma(texto, 'en')).toBe('Hello');
    expect(resolverIdioma(texto, 'es')).toBe('Hola');
  });

  it('cae a es si en esta vacio', () => {
    expect(resolverIdioma({ es: 'Hola', en: '' }, 'en')).toBe('Hola');
  });

  it('cae a es con un idioma no soportado o sin idioma', () => {
    expect(resolverIdioma(texto, 'fr')).toBe('Hola');
    expect(resolverIdioma(texto, undefined)).toBe('Hola');
  });

  it('resuelve los localizados anidados en objetos y arrays', () => {
    const entrada = {
      id: 'abc',
      descripcion: texto,
      hitos: [{ id: 'h1', descripcion: { es: 'Hito', en: '' } }],
      idiomas: [{ idioma: { es: 'Ingles', en: 'English' }, nivel: texto }],
    };

    expect(resolverIdioma(entrada, 'en')).toEqual({
      id: 'abc',
      descripcion: 'Hello',
      hitos: [{ id: 'h1', descripcion: 'Hito' }],
      idiomas: [{ idioma: 'English', nivel: 'Hello' }],
    });
  });

  it('no toca objetos con otras claves, primitivos, null ni fechas', () => {
    const fecha = new Date('2020-01-01');
    const entrada = {
      soloEs: { es: 'Hola' },
      conExtra: { es: 'Hola', en: 'Hello', otro: 1 },
      numero: 3,
      nulo: null,
      fecha,
      lista: ['a', 1],
    };

    const salida = resolverIdioma(entrada, 'en');

    expect(salida).toEqual(entrada);
    expect(salida.fecha).toBe(fecha);
  });
});

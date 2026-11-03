import es from '../../src/i18n/locales/es.json';
import en from '../../src/i18n/locales/en.json';

// Rutas de todas las claves hoja: { a: { b: 'x' } } → ['a.b']
const claves = (objeto: object, prefijo = ''): string[] =>
  Object.entries(objeto).flatMap(([clave, valor]) =>
    typeof valor === 'object' && valor !== null
      ? claves(valor, `${prefijo}${clave}.`)
      : [`${prefijo}${clave}`],
  );

describe('locales', () => {
  test('es.json y en.json tienen las mismas claves', () => {
    expect(claves(en).sort()).toEqual(claves(es).sort());
  });

  test('ninguna traducción está vacía', () => {
    const vacias = (objeto: object) =>
      claves(objeto).filter(
        (ruta) =>
          !ruta
            .split('.')
            .reduce<unknown>(
              (nodo, parte) => (nodo as Record<string, unknown>)[parte],
              objeto,
            ),
      );

    expect(vacias(es)).toEqual([]);
    expect(vacias(en)).toEqual([]);
  });
});

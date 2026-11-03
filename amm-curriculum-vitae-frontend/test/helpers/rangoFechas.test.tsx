import { rangoFechas } from '../../src/helpers/rangoFechas';
import i18n from '../../src/i18n';

const t = i18n.getFixedT('es');

describe('rangoFechas', () => {
  test('con las dos fechas devuelve el rango en formato es-ES', () => {
    expect(
      rangoFechas(t, '2019-03-01T12:00:00.000Z', '2021-11-15T12:00:00.000Z'),
    ).toBe('03/2019 - 11/2021');
  });

  test('sin fecha de fin el rango queda abierto', () => {
    expect(rangoFechas(t, '2019-03-01T12:00:00.000Z')).toBe(
      '03/2019 - En la actualidad',
    );
  });

  test('una fecha de fin vacia se trata como rango abierto', () => {
    expect(rangoFechas(t, '2019-03-01T12:00:00.000Z', '')).toBe(
      '03/2019 - En la actualidad',
    );
  });

  test('acepta fechas en formato corto', () => {
    expect(rangoFechas(t, '2019-03-01', '2021-11-15')).toBe(
      '03/2019 - 11/2021',
    );
  });
});

describe('rangoFechas en inglés', () => {
  const tEn = i18n.getFixedT('en');

  test('sin fecha de fin el rango queda abierto con «Present»', () => {
    expect(rangoFechas(tEn, '2019-03-01T12:00:00.000Z')).toBe(
      '03/2019 - Present',
    );
  });

  test('con las dos fechas el formato no cambia', () => {
    expect(rangoFechas(tEn, '2019-03-01', '2021-11-15')).toBe(
      '03/2019 - 11/2021',
    );
  });
});

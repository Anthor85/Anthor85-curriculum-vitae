import { rangoFechas } from '../../src/helpers/rangoFechas';

describe('rangoFechas', () => {
  test('con las dos fechas devuelve el rango en formato es-ES', () => {
    expect(
      rangoFechas('2019-03-01T12:00:00.000Z', '2021-11-15T12:00:00.000Z'),
    ).toBe('01/03/2019 - 15/11/2021');
  });

  test('sin fecha de fin el rango queda abierto', () => {
    expect(rangoFechas('2019-03-01T12:00:00.000Z')).toBe(
      '01/03/2019 - En la actualidad',
    );
  });

  test('una fecha de fin vacia se trata como rango abierto', () => {
    expect(rangoFechas('2019-03-01T12:00:00.000Z', '')).toBe(
      '01/03/2019 - En la actualidad',
    );
  });

  test('acepta fechas en formato corto', () => {
    expect(rangoFechas('2019-03-01', '2021-11-15')).toBe(
      '01/03/2019 - 15/11/2021',
    );
  });
});

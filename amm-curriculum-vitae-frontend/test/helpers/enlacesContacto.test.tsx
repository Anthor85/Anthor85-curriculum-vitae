import {
  enlaceEmail,
  enlaceMaps,
  enlaceTelefono,
} from '../../src/helpers/enlacesContacto';

describe('enlaceMaps', () => {
  test('codifica espacios, comas y tildes de la dirección', () => {
    expect(enlaceMaps('Calle Mayor 5, Alicante')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Calle%20Mayor%205%2C%20Alicante',
    );
    expect(enlaceMaps('Plaza España')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Plaza%20Espa%C3%B1a',
    );
  });
});

describe('enlaceTelefono', () => {
  test.each([
    ['666555444', 'tel:666555444'],
    ['666 55 54 44', 'tel:666555444'],
    ['666-555-444', 'tel:666555444'],
    ['666.555.444', 'tel:666555444'],
    ['(965) 555 444', 'tel:965555444'],
  ])('limpia separadores de %s', (telefono, esperado) => {
    expect(enlaceTelefono(telefono)).toBe(esperado);
  });

  test('conserva el + inicial y no añade prefijo de país', () => {
    expect(enlaceTelefono('+34 666 555 444')).toBe('tel:+34666555444');
    expect(enlaceTelefono('666555444')).not.toContain('+34');
  });
});

describe('enlaceEmail', () => {
  test('antepone mailto: al email tal cual', () => {
    expect(enlaceEmail('antonio@menendez.com')).toBe(
      'mailto:antonio@menendez.com',
    );
  });
});

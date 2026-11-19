/* global describe, it, expect */
const { validarIcono, MAX_ICONO } = require('../../helpers/validarIcono');
const iconosIniciales = require('../../scripts/data/iconosConocimientos.json');

const SIMPLE_ICONS =
  '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>React</title><path d="M12 0L24 24H0z"/></svg>';
const LUCIDE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4.1 12 6" /><circle cx="12" cy="12" r="3" /></svg>';

const envolver = (interior) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${interior}</svg>`;

const esperarNoValido = (valor) => {
  expect(() => validarIcono(valor)).toThrow(
    expect.objectContaining({ status: 400, message: 'Icono SVG no válido' }),
  );
};

describe('validarIcono', () => {
  it('sin valor devuelve cadena vacia', () => {
    expect(validarIcono(undefined)).toBe('');
    expect(validarIcono(null)).toBe('');
    expect(validarIcono('')).toBe('');
  });

  it('acepta iconos de Simple Icons y Lucide', () => {
    expect(validarIcono(SIMPLE_ICONS)).toBe(SIMPLE_ICONS);
    expect(validarIcono(LUCIDE)).toBe(LUCIDE);
  });

  it('acepta los 42 iconos iniciales', () => {
    expect(iconosIniciales).toHaveLength(42);
    for (const { icono } of iconosIniciales) {
      expect(() => validarIcono(icono)).not.toThrow();
    }
  });

  it('acepta href internos con #', () => {
    const svg = envolver('<use href="#a"/><use xlink:href=\'#b\'/>');
    expect(validarIcono(svg)).toBe(svg);
  });

  it('quita espacios, el prologo xml y los comentarios', () => {
    const entrada = `  <?xml version="1.0" encoding="UTF-8"?>\n<!-- autor -->${envolver(
      '<!-- dentro --><path d="M0 0"/>',
    )}\n  `;
    expect(validarIcono(entrada)).toBe(envolver('<path d="M0 0"/>'));
  });

  it('rechaza valores que no son string', () => {
    esperarNoValido(42);
    esperarNoValido({ svg: SIMPLE_ICONS });
    esperarNoValido(['<svg></svg>']);
  });

  it('rechaza lo que no empieza por <svg o no termina en </svg>', () => {
    esperarNoValido('<div></div>');
    esperarNoValido('texto <svg></svg>');
    esperarNoValido('<svg></svg> texto');
    esperarNoValido('<svg>');
  });

  it(`rechaza mas de ${MAX_ICONO} caracteres`, () => {
    const relleno = 'M0 0'.repeat(MAX_ICONO / 4);
    esperarNoValido(envolver(`<path d="${relleno}"/>`));
  });

  it.each([
    ['script', '<script>alert(1)</script>'],
    ['script en mayusculas', '<SCRIPT>alert(1)</SCRIPT>'],
    ['foreignObject', '<foreignObject><div/></foreignObject>'],
    ['iframe', '<iframe src="#"/>'],
    ['embed', '<embed src="#"/>'],
    ['object', '<object data="#"/>'],
    ['image', '<image href="#a"/>'],
    ['style', '<style>path{fill:red}</style>'],
    ['javascript:', '<a href="#" title="javascript:x"/>'],
    ['data:', '<path d="M0 0" title="data:x"/>'],
    ['atributo onload', '<path onload="x()" d="M0 0"/>'],
    ['atributo onclick con espacios', '<path onClick = "x()" d="M0 0"/>'],
    ['href externo', '<a href="https://evil.test"><path d="M0 0"/></a>'],
    ['xlink:href externo', '<use xlink:href="https://evil.test/a.svg#x"/>'],
    ['href sin comillas', '<a href=http://evil.test><path d="M0 0"/></a>'],
  ])('rechaza %s', (_, interior) => {
    esperarNoValido(envolver(interior));
  });

  it('rechaza DOCTYPE y ENTITY', () => {
    esperarNoValido(`<!DOCTYPE svg [<!ENTITY x "y">]>${envolver('')}`);
    esperarNoValido(envolver('<!ENTITY x "y">'));
  });
});

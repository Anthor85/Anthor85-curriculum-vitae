const { HttpError } = require('./HttpError');

const MAX_ICONO = 10000;

// Se rechaza el SVG entero si contiene cualquiera de estas cadenas (sin
// distinguir mayúsculas). No se intenta sanear quitando nodos.
const PROHIBIDOS = [
  '<script',
  '<foreignobject',
  '<iframe',
  '<embed',
  '<object',
  '<image',
  '<style',
  '<!doctype',
  '<!entity',
  'javascript:',
  'data:',
];

const ATRIBUTO_EVENTO = /\son[a-z]+\s*=/i;
// Captura el valor de href / xlink:href con comillas simples, dobles o sin ellas.
const HREF = /(?:^|[\s:])href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi;

const noValido = () => new HttpError(400, 'Icono SVG no válido');

const normalizarIcono = (svg) =>
  svg
    .trim()
    .replace(/^<\?xml[\s\S]*?\?>/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

const tieneHrefExterno = (svg) =>
  [...svg.matchAll(HREF)].some(([, doble, simple, sinComillas]) => {
    const valor = (doble ?? simple ?? sinComillas ?? '').trim();
    return !valor.startsWith('#');
  });

// Devuelve el SVG normalizado ('' si no hay icono) o lanza HttpError 400.
const validarIcono = (valor) => {
  if (valor === undefined || valor === null || valor === '') return '';
  if (typeof valor !== 'string') throw noValido();

  const svg = normalizarIcono(valor);
  const minusculas = svg.toLowerCase();

  if (
    svg.length > MAX_ICONO ||
    !minusculas.startsWith('<svg') ||
    !minusculas.endsWith('</svg>') ||
    PROHIBIDOS.some((patron) => minusculas.includes(patron)) ||
    ATRIBUTO_EVENTO.test(svg) ||
    tieneHrefExterno(svg)
  ) {
    throw noValido();
  }

  return svg;
};

module.exports = { validarIcono, normalizarIcono, MAX_ICONO };

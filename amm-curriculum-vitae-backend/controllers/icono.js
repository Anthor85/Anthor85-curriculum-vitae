const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');
const { obtenerTraductor } = require('../helpers/deepl');
const { validarIcono, normalizarIcono } = require('../helpers/validarIcono');

// Versiones fijadas: resultados reproducibles y tests estables.
const SIMPLE_ICONS_VERSION = '16.38.0';
const LUCIDE_VERSION = '1.75.0';
const CDN = 'https://cdn.jsdelivr.net/npm';
const SIMPLE_ICONS = `${CDN}/simple-icons@${SIMPLE_ICONS_VERSION}`;
const LUCIDE = `${CDN}/lucide-static@${LUCIDE_VERSION}`;

const MAX_Q = 100;
// Los nombres del catálogo acaban en una URL: solo se aceptan los esperados.
const NOMBRE_FICHERO = /^[a-z0-9-]+$/;
const MAX_RESULTADOS = 8;
const TIMEOUT_MS = 8000;

// Catálogos cacheados en memoria del módulo tras la primera descarga correcta.
let catalogoSimpleIcons;
let catalogoLucide;

// Solo para tests: fuerza a descargar de nuevo los catálogos.
const reiniciarCatalogos = () => {
  catalogoSimpleIcons = undefined;
  catalogoLucide = undefined;
};

// Minúsculas, sin acentos ni caracteres no alfanuméricos.
const normalizar = (texto) =>
  String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// El texto entero y cada palabra, sin repetidos ni términos de < 2 caracteres.
const extraerTerminos = (texto) => [
  ...new Set(
    [texto, ...texto.split(/[\s(),/]+/)]
      .map(normalizar)
      .filter((termino) => termino.length >= 2),
  ),
];

// Igual = 3, empieza por = 2, contiene (término ≥ 4) = 1. Un icono se queda
// con la mejor puntuación entre todos sus nombres y todos los términos.
const puntuar = (nombres, terminos) => {
  let mejor = 0;
  for (const nombre of nombres) {
    for (const termino of terminos) {
      if (nombre === termino) return 3;
      if (nombre.startsWith(termino)) mejor = Math.max(mejor, 2);
      else if (termino.length >= 4 && nombre.includes(termino)) {
        mejor = Math.max(mejor, 1);
      }
    }
  }
  return mejor;
};

const descargar = async (url) => {
  const respuesta = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!respuesta.ok) {
    throw new Error(`${url} respondió ${respuesta.status}`);
  }
  return respuesta;
};

const obtenerSimpleIcons = async () => {
  if (!catalogoSimpleIcons) {
    const respuesta = await descargar(`${SIMPLE_ICONS}/data/simple-icons.json`);
    catalogoSimpleIcons = (await respuesta.json())
      .filter(({ slug }) => NOMBRE_FICHERO.test(slug ?? ''))
      .map(({ title, slug, aliases }) => ({
        nombre: title,
        slug,
        nombres: [
          slug,
          title,
          ...(aliases?.aka ?? []),
          ...(aliases?.dup ?? []).map((dup) => dup.title),
          ...Object.values(aliases?.loc ?? {}),
        ]
          .map(normalizar)
          .filter(Boolean),
      }));
  }
  return catalogoSimpleIcons;
};

const obtenerLucide = async () => {
  if (!catalogoLucide) {
    const respuesta = await descargar(`${LUCIDE}/tags.json`);
    catalogoLucide = Object.entries(await respuesta.json())
      .filter(([nombre]) => NOMBRE_FICHERO.test(nombre))
      .map(([nombre, tags]) => ({
        nombre,
        nombres: [nombre, ...(tags ?? [])].map(normalizar).filter(Boolean),
      }));
  }
  return catalogoLucide;
};

// Los tags de Lucide están en inglés. Sin clave o si DeepL falla se busca con
// el texto original.
const traducirConsulta = async (q) => {
  const traductor = obtenerTraductor();
  if (!traductor) return q;
  try {
    const { text } = await traductor.translateText(q, null, 'en-GB');
    return text;
  } catch (error) {
    console.error(error);
    return q;
  }
};

const mejores = (catalogo, terminos) =>
  catalogo
    .map((icono) => ({ icono, puntos: puntuar(icono.nombres, terminos) }))
    .filter(({ puntos }) => puntos > 0)
    .sort(
      (a, b) =>
        b.puntos - a.puntos || a.icono.nombre.localeCompare(b.icono.nombre),
    )
    .map(({ icono }) => icono);

// Sin comentarios, <title> ni class, y sin saltos de línea sobrantes.
const limpiarSvg = (svg) =>
  normalizarIcono(svg)
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/\sclass\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ');

// Descarga el SVG y lo valida; null si falla cualquiera de las dos cosas.
const descargarSvg = async ({ nombre, fuente, url }) => {
  try {
    const respuesta = await descargar(url);
    const icono = validarIcono(limpiarSvg(await respuesta.text()));
    return icono ? { nombre, fuente, icono } : null;
  } catch {
    return null;
  }
};

const escaparXml = (texto) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Iniciales de q (máx. 2): primera letra de las dos primeras palabras, o las
// dos primeras letras si solo hay una.
const iniciales = (q) => {
  const palabras = q.match(/[\p{L}\p{N}]+/gu) ?? [q];
  const letras =
    palabras.length > 1
      ? palabras[0][0] + palabras[1][0]
      : [...palabras[0]].slice(0, 2).join('');
  return letras.toUpperCase();
};

// Cuadrado redondeado con borde y las iniciales dentro. Solo usa
// currentColor, así que funciona pintado como máscara monocroma.
const crearMonograma = (q) => {
  const nombre = iniciales(q);
  const icono =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<text x="12" y="12.5" fill="currentColor" font-family="Arial, Helvetica, sans-serif" font-size="9" font-weight="700" text-anchor="middle" dominant-baseline="middle">' +
    `${escaparXml(nombre)}</text></svg>`;
  return { nombre, fuente: 'monograma', icono: validarIcono(icono) };
};

const validarQ = (q) => {
  const texto = typeof q === 'string' ? q.trim() : '';
  if (texto.length < 1 || texto.length > MAX_Q) {
    throw new HttpError(400, `q debe tener entre 1 y ${MAX_Q} caracteres`);
  }
  return texto;
};

// Busca iconos por nombre: marcas en Simple Icons, conceptos en Lucide y
// siempre un monograma al final.
const buscarIconos = async (req, res) => {
  const q = validarQ(req.query.q);

  const [simpleIcons, lucide] = await Promise.allSettled([
    obtenerSimpleIcons(),
    obtenerLucide(),
  ]);
  if (simpleIcons.status === 'rejected' && lucide.status === 'rejected') {
    console.error(simpleIcons.reason, lucide.reason);
    throw new HttpError(502, 'Error del servicio de iconos');
  }

  const candidatos = [];
  if (simpleIcons.status === 'fulfilled') {
    candidatos.push(
      ...mejores(simpleIcons.value, extraerTerminos(q)).map(
        ({ nombre, slug }) => ({
          nombre,
          fuente: 'simple-icons',
          url: `${SIMPLE_ICONS}/icons/${slug}.svg`,
        }),
      ),
    );
  }
  if (lucide.status === 'fulfilled' && candidatos.length < MAX_RESULTADOS) {
    const terminos = extraerTerminos(await traducirConsulta(q));
    candidatos.push(
      ...mejores(lucide.value, terminos).map(({ nombre }) => ({
        nombre,
        fuente: 'lucide',
        url: `${LUCIDE}/icons/${nombre}.svg`,
      })),
    );
  }

  const descargados = await Promise.all(
    candidatos.slice(0, MAX_RESULTADOS).map(descargarSvg),
  );

  res.json({
    resultados: [...descargados.filter(Boolean), crearMonograma(q)],
  });
};

module.exports = {
  buscarIconos: conContexto('Error al buscar iconos', buscarIconos),
  reiniciarCatalogos,
};

// Prerender de "/" (es) y "/en" (en): pide el currículum de cada idioma a la
// API, lo pinta con el build SSR (dist-server/) y escribe dist/index.html y
// dist/en/index.html con el contenido, el estado para hidratar y los
// metadatos. dist/spa.html queda como carcasa vacía para el resto de rutas.
// Cualquier fallo termina con código distinto de 0.
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

// dateConverter usa mes y año locales: el build corre en UTC y el visitante,
// casi siempre, en hora peninsular. Sin esto la hidratación no cuadraría.
process.env.TZ = 'Europe/Madrid';

const raiz = process.cwd();
const INDEX = path.join(raiz, 'dist', 'index.html');
const SPA = path.join(raiz, 'dist', 'spa.html');
const DIR_SERVIDOR = path.join(raiz, 'dist-server');
const ENTRADA_SERVIDOR = path.join(DIR_SERVIDOR, 'entry-server.mjs');

const PAGINAS = [
  { idioma: 'es', salida: INDEX },
  { idioma: 'en', salida: path.join(raiz, 'dist', 'en', 'index.html') },
];

const MARCADORES = {
  html: /<html lang="[^"]*">/,
  titulo: /<title>[\s\S]*?<\/title>/,
  finHead: /[ \t]*<\/head>/,
  favicon: /<link id="favicon"[^>]*>/,
  root: /<div id="root"><\/div>/,
};

const escaparHtml = (texto) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const leerVariables = () => {
  const env = loadEnv('production', raiz, 'VITE_');
  const faltan = ['VITE_BASE_URL', 'VITE_SITE_URL'].filter(
    (nombre) => !env[nombre]?.trim(),
  );

  if (faltan.length) {
    throw new Error(`Falta la variable de entorno ${faltan.join(' y ')}.`);
  }

  return {
    baseUrl: env.VITE_BASE_URL.trim().replace(/\/+$/, ''),
    siteUrl: env.VITE_SITE_URL.trim().replace(/\/+$/, ''),
  };
};

const pedirCurriculum = async (baseUrl, idioma) => {
  const url = `${baseUrl}/curriculum?lang=${idioma}`;
  let respuesta;

  try {
    respuesta = await fetch(url);
  } catch (error) {
    // Con ECONNREFUSED el mensaje llega vacío y lo útil es el código
    const causa = error.cause?.code || error.cause?.message || error.message;
    throw new Error(
      `No se pudo conectar con la API (GET ${url}): ${causa}. ¿Está el backend levantado?`,
    );
  }

  if (respuesta.status !== 200) {
    throw new Error(
      `La API respondió ${respuesta.status} a GET ${url}; se esperaba 200.`,
    );
  }

  return respuesta.json();
};

const etiquetasMeta = (metas) =>
  [
    metas.descripcion && ['name', 'description', metas.descripcion],
    ['property', 'og:type', 'website'],
    ['property', 'og:locale', metas.locale],
    ['property', 'og:locale:alternate', metas.localeAlternativo],
    ['property', 'og:title', metas.titulo],
    metas.descripcion && ['property', 'og:description', metas.descripcion],
    ['property', 'og:url', metas.url],
    ['property', 'og:image', metas.imagen],
    ['name', 'twitter:card', metas.tarjeta],
  ]
    .filter(Boolean)
    .map(
      ([atributo, clave, valor]) =>
        `    <meta ${atributo}="${clave}" content="${escaparHtml(valor)}" />\n`,
    )
    .join('');

// canonical propio y hreflang cruzados: las dos páginas enlazan a las dos versiones
const etiquetasEnlace = (metas) =>
  [
    `    <link rel="canonical" href="${escaparHtml(metas.url)}" />\n`,
    ...metas.alternativos.map(
      ({ hreflang, href }) =>
        `    <link rel="alternate" hreflang="${hreflang}" href="${escaparHtml(href)}" />\n`,
    ),
  ].join('');

const inyectar = (html, { idioma, contenido, curriculum, metas }) => {
  const ausentes = Object.entries(MARCADORES)
    .filter(([, patron]) => !patron.test(html))
    .map(([nombre]) => nombre);

  if (ausentes.length) {
    throw new Error(
      `No se encontró en dist/index.html el marcador: ${ausentes.join(', ')}.`,
    );
  }

  // "<" escapado para que el JSON no pueda cerrar el <script>
  const estado = JSON.stringify({ idioma, curriculum }).replace(
    /</g,
    '\\u003c',
  );

  // Los reemplazos van como función: en una cadena, "$" tendría significado.
  let resultado = html
    .replace(MARCADORES.html, () => `<html lang="${idioma}">`)
    .replace(
      MARCADORES.titulo,
      () => `<title>${escaparHtml(metas.titulo)}</title>`,
    )
    .replace(
      MARCADORES.finHead,
      () => `${etiquetasMeta(metas)}${etiquetasEnlace(metas)}  </head>`,
    )
    // El script inline se ejecuta antes que el módulo de la app, que es diferido
    .replace(
      MARCADORES.root,
      () =>
        `<div id="root">${contenido}</div>\n    <script>window.__CURRICULUM__=${estado}</script>`,
    );

  if (metas.favicon) {
    resultado = resultado.replace(
      MARCADORES.favicon,
      () =>
        `<link id="favicon" rel="icon" href="${escaparHtml(metas.favicon)}" />`,
    );
  }

  return resultado;
};

const prerender = async () => {
  const { baseUrl, siteUrl } = leerVariables();
  const curriculums = await Promise.all(
    PAGINAS.map(({ idioma }) => pedirCurriculum(baseUrl, idioma)),
  );

  const { render, metasCurriculum } = await import(
    pathToFileURL(ENTRADA_SERVIDOR).href
  );

  // La plantilla se lee antes de sobrescribir dist/index.html
  await copyFile(INDEX, SPA);
  const plantilla = await readFile(INDEX, 'utf8');

  // Renders seguidos y síncronos: el store singleton no mezcla los idiomas
  for (const [indice, { idioma, salida }] of PAGINAS.entries()) {
    const curriculum = curriculums[indice];
    const html = inyectar(plantilla, {
      idioma,
      contenido: render(curriculum, idioma),
      curriculum,
      metas: metasCurriculum(curriculum.perfil, siteUrl, idioma),
    });

    await mkdir(path.dirname(salida), { recursive: true });
    await writeFile(salida, html);
  }
};

try {
  await prerender();
  console.log(
    'Prerender: dist/index.html, dist/en/index.html y dist/spa.html generados.',
  );
} catch (error) {
  console.error(`Prerender fallido: ${error.message}`);
  process.exitCode = 1;
} finally {
  await rm(DIR_SERVIDOR, { recursive: true, force: true });
}

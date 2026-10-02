// Prerender de "/": pide el currículum a la API, lo pinta con el build SSR
// (dist-server/) y reescribe dist/index.html con el contenido, el estado para
// hidratar y los metadatos. dist/spa.html queda como carcasa vacía para el
// resto de rutas. Cualquier fallo termina con código distinto de 0.
import { copyFile, readFile, rm, writeFile } from 'node:fs/promises';
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

const MARCADORES = {
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

const pedirCurriculum = async (baseUrl) => {
  const url = `${baseUrl}/curriculum`;
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
    ['property', 'og:locale', 'es_ES'],
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

const inyectar = (html, { contenido, curriculum, metas }) => {
  const ausentes = Object.entries(MARCADORES)
    .filter(([, patron]) => !patron.test(html))
    .map(([nombre]) => nombre);

  if (ausentes.length) {
    throw new Error(
      `No se encontró en dist/index.html el marcador: ${ausentes.join(', ')}.`,
    );
  }

  // "<" escapado para que el JSON no pueda cerrar el <script>
  const estado = JSON.stringify(curriculum).replace(/</g, '\\u003c');

  // Los reemplazos van como función: en una cadena, "$" tendría significado.
  let resultado = html
    .replace(
      MARCADORES.titulo,
      () => `<title>${escaparHtml(metas.titulo)}</title>`,
    )
    .replace(MARCADORES.finHead, () => `${etiquetasMeta(metas)}  </head>`)
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
  const curriculum = await pedirCurriculum(baseUrl);

  const { render, metasCurriculum } = await import(
    pathToFileURL(ENTRADA_SERVIDOR).href
  );

  await copyFile(INDEX, SPA);

  const html = inyectar(await readFile(INDEX, 'utf8'), {
    contenido: render(curriculum),
    curriculum,
    metas: metasCurriculum(curriculum.perfil, siteUrl),
  });

  await writeFile(INDEX, html);
};

try {
  await prerender();
  console.log('Prerender: dist/index.html y dist/spa.html generados.');
} catch (error) {
  console.error(`Prerender fallido: ${error.message}`);
  process.exitCode = 1;
} finally {
  await rm(DIR_SERVIDOR, { recursive: true, force: true });
}

/* global describe, it, expect, beforeEach, afterEach, vi */
const { Types } = require('mongoose');
const request = require('supertest');
const deepl = require('deepl-node');

const app = require('../../index');
const { reiniciarCatalogos } = require('../../controllers/icono');
const { validarIcono } = require('../../helpers/validarIcono');
const { tokenValido } = require('../utils/token');

// Catálogos falsos con la misma forma que los reales de jsDelivr.
const SIMPLE_ICONS = [
  {
    title: 'React',
    slug: 'react',
    aliases: { dup: [{ title: 'React Native' }] },
  },
  { title: 'React Router', slug: 'reactrouter' },
  { title: 'Jest', slug: 'jest' },
  { title: 'Vitest', slug: 'vitest' },
  { title: 'Testing Library', slug: 'testinglibrary' },
  { title: 'Malicioso', slug: 'malicioso' },
];
const LUCIDE = {
  atom: ['react', 'nucleus'],
  network: ['microservices', 'connection'],
  server: ['microservices', 'backend'],
  'flask-conical': ['testing', 'lab'],
  'shield-alert': ['malicioso'],
};

const svgDe = (nombre) =>
  `<!-- @license -->\n<svg class="i-${nombre}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">\n  <title>${nombre}</title>\n  <path d="M0 0h24"/>\n</svg>\n`;
const SVG_SCRIPT =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';

const respuesta = (cuerpo, status = 200) =>
  new Response(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), {
    status,
  });

// Simula jsDelivr. `fallar` lista los catálogos que responden 500.
const simularCdn = ({ fallar = [] } = {}) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const ruta = String(url);
    if (ruta.endsWith('/data/simple-icons.json')) {
      return fallar.includes('simple-icons')
        ? respuesta('error', 500)
        : respuesta(SIMPLE_ICONS);
    }
    if (ruta.endsWith('/tags.json')) {
      return fallar.includes('lucide')
        ? respuesta('error', 500)
        : respuesta(LUCIDE);
    }
    const [, nombre] = ruta.match(/\/icons\/([^/]+)\.svg$/) ?? [];
    if (!nombre) return respuesta('no encontrado', 404);
    if (nombre === 'malicioso' || nombre === 'shield-alert') {
      return respuesta(SVG_SCRIPT);
    }
    return respuesta(svgDe(nombre));
  });

const llamadasA = (fetchEspia, final) =>
  fetchEspia.mock.calls.filter(([url]) => String(url).endsWith(final)).length;

describe('/api/icono', () => {
  let token;
  const claveOriginal = process.env.DEEPL_API_KEY;

  const buscar = (q) =>
    request(app).get('/api/icono').query({ q }).set('x-token', token);

  beforeEach(() => {
    token = tokenValido(new Types.ObjectId().toString());
    delete process.env.DEEPL_API_KEY;
    reiniciarCatalogos();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (claveOriginal === undefined) delete process.env.DEEPL_API_KEY;
    else process.env.DEEPL_API_KEY = claveOriginal;
  });

  describe('validación', () => {
    it('sin token devuelve 401 y no descarga nada', async () => {
      const fetchEspia = simularCdn();

      await request(app).get('/api/icono?q=React').expect(401);

      expect(fetchEspia).not.toHaveBeenCalled();
    });

    it('sin q, con q vacio o con mas de 100 caracteres devuelve 400', async () => {
      simularCdn();

      await request(app).get('/api/icono').set('x-token', token).expect(400);
      await buscar('   ').expect(400);
      const { body } = await buscar('a'.repeat(101)).expect(400);

      expect(body).toEqual({ msg: 'q debe tener entre 1 y 100 caracteres' });
    });

    it('con q repetido (array) devuelve 400', async () => {
      simularCdn();

      await request(app)
        .get('/api/icono?q=a&q=b')
        .set('x-token', token)
        .expect(400);
    });
  });

  describe('búsqueda', () => {
    it('q=React devuelve primero Simple Icons React y al final el monograma', async () => {
      simularCdn();

      const { body } = await buscar('React').expect(200);

      const { resultados } = body;
      expect(resultados[0]).toMatchObject({
        nombre: 'React',
        fuente: 'simple-icons',
      });
      expect(resultados.map(({ nombre }) => nombre)).toContain('React Router');
      expect(resultados.at(-1)).toMatchObject({
        nombre: 'RE',
        fuente: 'monograma',
      });
      expect(resultados.length).toBeLessThanOrEqual(9);
    });

    it('limpia los SVG descargados y todos pasan validarIcono', async () => {
      simularCdn();

      const { body } = await buscar('React').expect(200);

      for (const { icono } of body.resultados) {
        expect(validarIcono(icono)).toBe(icono);
        expect(icono).not.toMatch(/<title>|class=|<!--|\n/);
      }
      expect(body.resultados[0].icono).toBe(
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24"/></svg>',
      );
    });

    it('q con varias palabras encuentra cada una (Jest y Vitest)', async () => {
      simularCdn();

      const { body } = await buscar('Testing FrontEnd (Jest, Vitest)').expect(
        200,
      );

      const nombres = body.resultados.map(({ nombre }) => nombre);
      expect(nombres).toEqual(expect.arrayContaining(['Jest', 'Vitest']));
      expect(body.resultados.at(-1)).toMatchObject({
        nombre: 'TF',
        fuente: 'monograma',
      });
    });

    it('traduce q con DeepL para buscar en Lucide', async () => {
      process.env.DEEPL_API_KEY = 'clave-secreta-de-test:fx';
      simularCdn();
      const traducir = vi
        .spyOn(deepl.Translator.prototype, 'translateText')
        .mockResolvedValue({ text: 'Microservices' });

      const { body } = await buscar('Microservicios').expect(200);

      expect(traducir).toHaveBeenCalledWith('Microservicios', null, 'en-GB');
      const lucide = body.resultados.filter(
        ({ fuente }) => fuente === 'lucide',
      );
      expect(lucide.map(({ nombre }) => nombre)).toEqual(['network', 'server']);
    });

    it('si DeepL falla busca con q tal cual', async () => {
      process.env.DEEPL_API_KEY = 'clave-secreta-de-test:fx';
      simularCdn();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(deepl.Translator.prototype, 'translateText').mockRejectedValue(
        new Error('DeepL caído'),
      );

      const { body } = await buscar('testing').expect(200);

      expect(body.resultados).toContainEqual(
        expect.objectContaining({ nombre: 'flask-conical', fuente: 'lucide' }),
      );
    });

    it('sin DEEPL_API_KEY busca con q tal cual, sin error', async () => {
      simularCdn();
      const traducir = vi.spyOn(deepl.Translator.prototype, 'translateText');

      const { body } = await buscar('microservices').expect(200);

      expect(traducir).not.toHaveBeenCalled();
      expect(
        body.resultados
          .filter(({ fuente }) => fuente === 'lucide')
          .map(({ nombre }) => nombre),
      ).toEqual(['network', 'server']);
    });

    it('descarta los SVG descargados con <script>', async () => {
      simularCdn();

      const { body } = await buscar('Malicioso').expect(200);

      expect(body.resultados).toEqual([
        expect.objectContaining({ nombre: 'MA', fuente: 'monograma' }),
      ]);
    });

    it('sin coincidencias devuelve solo el monograma', async () => {
      simularCdn();

      const { body } = await buscar('IA ClaudeCode').expect(200);

      expect(body.resultados).toHaveLength(1);
      expect(body.resultados[0]).toMatchObject({
        nombre: 'IC',
        fuente: 'monograma',
      });
      expect(validarIcono(body.resultados[0].icono)).toBe(
        body.resultados[0].icono,
      );
    });

    it('el monograma escapa los caracteres especiales de XML', async () => {
      simularCdn();

      const { body } = await buscar('<&').expect(200);

      const monograma = body.resultados.at(-1);
      expect(monograma.fuente).toBe('monograma');
      expect(monograma.icono).toContain('&lt;&amp;</text>');
    });

    it('devuelve como mucho 8 resultados mas el monograma', async () => {
      const muchos = Array.from({ length: 12 }, (_, i) => ({
        title: `React ${i}`,
        slug: `react${i}`,
      }));
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const ruta = String(url);
        if (ruta.endsWith('/data/simple-icons.json')) return respuesta(muchos);
        if (ruta.endsWith('/tags.json')) return respuesta(LUCIDE);
        return respuesta(svgDe('x'));
      });

      const { body } = await buscar('React').expect(200);

      expect(body.resultados).toHaveLength(9);
      expect(body.resultados.at(-1).fuente).toBe('monograma');
    });
  });

  describe('fallos y caché', () => {
    it('si falla Simple Icons responde 200 con Lucide y el monograma', async () => {
      simularCdn({ fallar: ['simple-icons'] });

      const { body } = await buscar('React').expect(200);

      expect(body.resultados.map(({ fuente }) => fuente)).toEqual([
        'lucide',
        'monograma',
      ]);
    });

    it('si falla Lucide responde 200 con Simple Icons y el monograma', async () => {
      simularCdn({ fallar: ['lucide'] });

      const { body } = await buscar('Jest').expect(200);

      expect(body.resultados.map(({ fuente }) => fuente)).toEqual([
        'simple-icons',
        'monograma',
      ]);
    });

    it('si fallan los dos catalogos devuelve 502', async () => {
      simularCdn({ fallar: ['simple-icons', 'lucide'] });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const { body } = await buscar('React').expect(502);

      expect(body).toEqual({ msg: 'Error del servicio de iconos' });
    });

    it('si falla la red al descargar un catalogo lo trata como fallo', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sin red'));

      await buscar('React').expect(502);
    });

    it('la segunda peticion no vuelve a descargar los catalogos', async () => {
      const fetchEspia = simularCdn();

      await buscar('React').expect(200);
      await buscar('Jest').expect(200);

      expect(llamadasA(fetchEspia, '/data/simple-icons.json')).toBe(1);
      expect(llamadasA(fetchEspia, '/tags.json')).toBe(1);
    });

    it('tras un fallo vuelve a intentar descargar el catalogo', async () => {
      const fetchEspia = simularCdn({ fallar: ['lucide'] });
      await buscar('React').expect(200);

      fetchEspia.mockRestore();
      const fetchEspia2 = simularCdn();
      await buscar('React').expect(200);

      expect(llamadasA(fetchEspia2, '/data/simple-icons.json')).toBe(0);
      expect(llamadasA(fetchEspia2, '/tags.json')).toBe(1);
    });
  });
});

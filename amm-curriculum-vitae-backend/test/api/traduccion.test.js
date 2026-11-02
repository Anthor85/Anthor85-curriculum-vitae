/* global describe, it, expect, beforeEach, afterEach, vi */
const { Types } = require('mongoose');
const request = require('supertest');
const deepl = require('deepl-node');

const app = require('../../index');
const { tokenValido } = require('../utils/token');

// vi.mock no intercepta el require CommonJS del controlador, así que se espía
// el prototipo del cliente real: ninguna petición sale hacia DeepL.
const espiarTraduccion = () =>
  vi.spyOn(deepl.Translator.prototype, 'translateText');

describe('/api/traduccion', () => {
  let token;
  const claveOriginal = process.env.DEEPL_API_KEY;

  beforeEach(() => {
    token = tokenValido(new Types.ObjectId().toString());
    process.env.DEEPL_API_KEY = 'clave-secreta-de-test:fx';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (claveOriginal === undefined) delete process.env.DEEPL_API_KEY;
    else process.env.DEEPL_API_KEY = claveOriginal;
  });

  describe('POST /api/traduccion', () => {
    it('sin token devuelve 401 y no llama a DeepL', async () => {
      const traducir = espiarTraduccion();

      const { body } = await request(app)
        .post('/api/traduccion')
        .send({ textos: ['Hola'] })
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      expect(traducir).not.toHaveBeenCalled();
    });

    it('con textos validos devuelve 200 con las traducciones en el mismo orden', async () => {
      const traducir = espiarTraduccion().mockResolvedValue([
        { text: 'Development of the new intranet' },
        { text: 'University of Valencia' },
      ]);

      const { body } = await request(app)
        .post('/api/traduccion')
        .set('x-token', token)
        .send({
          textos: [
            'Desarrollo de la nueva intranet',
            'Universidad de Valencia',
          ],
        })
        .expect(200);

      expect(body).toEqual({
        textos: ['Development of the new intranet', 'University of Valencia'],
      });
      expect(traducir).toHaveBeenCalledWith(
        ['Desarrollo de la nueva intranet', 'Universidad de Valencia'],
        'es',
        'en-GB',
      );
    });

    it.each([
      ['sin textos', {}],
      ['con textos que no es un array', { textos: 'Hola' }],
      ['con un array vacio', { textos: [] }],
      ['con mas de 50 textos', { textos: Array(51).fill('Hola') }],
      ['con un texto vacio', { textos: ['Hola', ''] }],
      ['con un texto de solo espacios', { textos: ['   '] }],
      ['con un texto que no es string', { textos: [1] }],
      ['con mas de 5000 caracteres en total', { textos: ['a'.repeat(5001)] }],
    ])('%s devuelve 400 y no llama a DeepL', async (_caso, peticion) => {
      const traducir = espiarTraduccion();

      const { body } = await request(app)
        .post('/api/traduccion')
        .set('x-token', token)
        .send(peticion)
        .expect(400);

      expect(body.msg).toEqual(expect.any(String));
      expect(traducir).not.toHaveBeenCalled();
    });

    it('sin DEEPL_API_KEY devuelve 503', async () => {
      delete process.env.DEEPL_API_KEY;
      const traducir = espiarTraduccion();

      const { body } = await request(app)
        .post('/api/traduccion')
        .set('x-token', token)
        .send({ textos: ['Hola'] })
        .expect(503);

      expect(body).toEqual({ msg: 'Traducción no disponible' });
      expect(traducir).not.toHaveBeenCalled();
    });

    it('con la cuota agotada devuelve 429', async () => {
      espiarTraduccion().mockRejectedValue(
        new deepl.QuotaExceededError('Quota for this billing period exceeded'),
      );

      const { body } = await request(app)
        .post('/api/traduccion')
        .set('x-token', token)
        .send({ textos: ['Hola'] })
        .expect(429);

      expect(body).toEqual({ msg: 'Cuota de traducción agotada' });
    });

    it('con cualquier otro error de DeepL devuelve 502 sin exponer la clave', async () => {
      espiarTraduccion().mockRejectedValue(
        new deepl.AuthorizationError(
          `Authorization failure (${process.env.DEEPL_API_KEY})`,
        ),
      );

      const { body } = await request(app)
        .post('/api/traduccion')
        .set('x-token', token)
        .send({ textos: ['Hola'] })
        .expect(502);

      expect(body).toEqual({ msg: 'Error del servicio de traducción' });
      expect(JSON.stringify(body)).not.toContain('clave-secreta-de-test');
    });
  });
});

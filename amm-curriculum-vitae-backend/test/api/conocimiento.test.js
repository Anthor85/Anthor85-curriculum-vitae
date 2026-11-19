/* global describe, it, expect, beforeEach */
const { Types } = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Conocimiento = require('../../models/Conocimiento');
const { crearConocimientoEnBd } = require('../utils/fixtures');
const { tokenValido } = require('../utils/token');

const loc = (es, en = '') => ({ es, en });

const ICONO =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z"/></svg>';
const OTRO_ICONO =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>';
const ICONO_SCRIPT =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
const ICONO_NO_VALIDO = { msg: 'Icono SVG no válido' };

describe('/api/conocimiento', () => {
  let token;

  beforeEach(() => {
    token = tokenValido(new Types.ObjectId().toString());
  });

  describe('GET /api/conocimiento', () => {
    it('devuelve 200 y un array vacio con la base vacia', async () => {
      const { body } = await request(app).get('/api/conocimiento').expect(200);

      expect(body).toEqual([]);
    });

    it('devuelve los conocimientos sembrados con id y sin _id ni __v', async () => {
      const conocimiento = await crearConocimientoEnBd({
        titulo: loc('Node'),
        prioridad: 'baja',
      });

      const { body } = await request(app).get('/api/conocimiento').expect(200);

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: conocimiento._id.toString(),
        titulo: loc('Node'),
        prioridad: 'baja',
        icono: '',
      });
      expect(body[0]).not.toHaveProperty('_id');
      expect(body[0]).not.toHaveProperty('__v');
    });
  });

  describe('POST /api/conocimiento', () => {
    it('con token devuelve 201, el documento creado y lo deja en la base', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('React', 'React'), prioridad: 'alta' })
        .expect(201);

      expect(body).toEqual({
        id: expect.any(String),
        titulo: loc('React', 'React'),
        prioridad: 'alta',
        icono: '',
      });
      await expect(Conocimiento.countDocuments()).resolves.toBe(1);
    });

    it('sin token devuelve 401 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .send({ titulo: loc('React'), prioridad: 'alta' })
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });

    it('con una prioridad fuera del enum devuelve 500 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('React'), prioridad: 'Experto' })
        .expect(500);

      expect(body).toEqual({ msg: 'Error al crear el conocimiento' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });

    it('con una prioridad antigua en texto devuelve 500 y con su clave 201', async () => {
      const antigua = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('React'), prioridad: 'Alta' })
        .expect(500);

      expect(antigua.body).toEqual({ msg: 'Error al crear el conocimiento' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);

      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('React'), prioridad: 'alta' })
        .expect(201);

      expect(body.prioridad).toBe('alta');
    });

    it('sin prioridad devuelve 201 con prioridad media', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('React') })
        .expect(201);

      expect(body.prioridad).toBe('media');
    });

    it.each(['muyAlta', 'alta', 'media', 'baja', 'muyBaja'])(
      'con prioridad %s devuelve 201 y la devuelve',
      async (prioridad) => {
        const { body } = await request(app)
          .post('/api/conocimiento')
          .set('x-token', token)
          .send({ titulo: loc('React'), prioridad })
          .expect(201);

        expect(body.prioridad).toBe(prioridad);
      },
    );

    it('con nivel y sin prioridad devuelve 201 e ignora nivel', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('React'), nivel: 'Avanzado' })
        .expect(201);

      expect(body).not.toHaveProperty('nivel');
      const enBd = await Conocimiento.findById(body.id).lean();
      expect(enBd).not.toHaveProperty('nivel');
    });
  });

  describe('POST /api/conocimiento (titulo bilingüe)', () => {
    it('sin en devuelve 201 y guarda en vacio', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: { es: '  Metodologías ágiles ' } })
        .expect(201);

      expect(body.titulo).toEqual(loc('Metodologías ágiles'));
      const enBd = await Conocimiento.findById(body.id).lean();
      expect(enBd.titulo).toEqual(loc('Metodologías ágiles'));
    });

    it('con es y en devuelve 201 y guarda los dos', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('Pruebas unitarias', 'Unit testing') })
        .expect(201);

      expect(body.titulo).toEqual(loc('Pruebas unitarias', 'Unit testing'));
    });

    it.each([
      ['string', 'React'],
      ['sin es', { en: 'React' }],
      ['es vacio', { es: '   ', en: 'React' }],
    ])('con titulo %s devuelve 500 y no crea nada', async (_caso, titulo) => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo })
        .expect(500);

      expect(body).toEqual({ msg: 'Error al crear el conocimiento' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });
  });

  describe('POST /api/conocimiento (icono)', () => {
    it('sin icono guarda cadena vacia', async () => {
      await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('React') })
        .expect(201);

      const enBd = await Conocimiento.findOne().lean();
      expect(enBd.icono).toBe('');
    });

    it('con un SVG valido lo guarda normalizado', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({
          titulo: loc('React'),
          icono: `  <?xml version="1.0"?><!-- logo -->${ICONO}
`,
        })
        .expect(201);

      expect(body.icono).toBe(ICONO);
      const enBd = await Conocimiento.findOne().lean();
      expect(enBd.icono).toBe(ICONO);
    });

    it('con un SVG no valido devuelve 400 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: loc('React'), icono: ICONO_SCRIPT })
        .expect(400);

      expect(body).toEqual(ICONO_NO_VALIDO);
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });
  });

  describe('POST /api/conocimiento/multiple', () => {
    it('valida los iconos y guarda los validos', async () => {
      await request(app)
        .post('/api/conocimiento/multiple')
        .set('x-token', token)
        .send([{ titulo: loc('React'), icono: ICONO }, { titulo: loc('Node') }])
        .expect(201);

      const enBd = await Conocimiento.find().lean();
      expect(enBd.map(({ icono }) => icono)).toEqual([ICONO, '']);
    });

    it('con un icono no valido devuelve 400 y no inserta ninguno', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento/multiple')
        .set('x-token', token)
        .send([
          { titulo: loc('React'), icono: ICONO },
          { titulo: loc('Node'), icono: ICONO_SCRIPT },
        ])
        .expect(400);

      expect(body).toEqual(ICONO_NO_VALIDO);
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });

    it('guarda los dos idiomas de cada elemento', async () => {
      await request(app)
        .post('/api/conocimiento/multiple')
        .set('x-token', token)
        .send([
          { titulo: loc('Metodologías ágiles', 'Agile methodologies') },
          { titulo: loc('Docker') },
        ])
        .expect(201);

      const enBd = await Conocimiento.find().lean();
      expect(enBd.map(({ titulo }) => titulo)).toEqual([
        loc('Metodologías ágiles', 'Agile methodologies'),
        loc('Docker'),
      ]);
    });

    it('con token y un array de dos devuelve 201 y deja dos en la base', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento/multiple')
        .set('x-token', token)
        .send([
          { titulo: loc('React'), prioridad: 'alta' },
          { titulo: loc('Node'), prioridad: 'baja' },
        ])
        .expect(201);

      expect(body).toHaveLength(2);
      expect(body.map(({ titulo }) => titulo.es)).toEqual(['React', 'Node']);
      await expect(Conocimiento.countDocuments()).resolves.toBe(2);
    });

    it('sin prioridad guarda media en todos', async () => {
      await request(app)
        .post('/api/conocimiento/multiple')
        .set('x-token', token)
        .send([{ titulo: loc('React') }, { titulo: loc('Node') }])
        .expect(201);

      const enBd = await Conocimiento.find();
      expect(enBd.map(({ prioridad }) => prioridad)).toEqual([
        'media',
        'media',
      ]);
    });
  });

  describe('PUT /api/conocimiento/:id', () => {
    it('con token actualiza titulo y prioridad y devuelve el documento actualizado', async () => {
      const conocimiento = await crearConocimientoEnBd();

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('Vue'), prioridad: 'muyBaja' })
        .expect(200);

      expect(body).toEqual({
        id: conocimiento._id.toString(),
        titulo: loc('Vue'),
        prioridad: 'muyBaja',
        icono: '',
      });
      const enBd = await Conocimiento.findById(conocimiento._id);
      expect(enBd.titulo.es).toBe('Vue');
      expect(enBd.prioridad).toBe('muyBaja');
    });

    it('cambia solo en y conserva es', async () => {
      const conocimiento = await crearConocimientoEnBd({
        titulo: loc('Pruebas unitarias'),
      });

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('Pruebas unitarias', 'Unit testing') })
        .expect(200);

      expect(body.titulo).toEqual(loc('Pruebas unitarias', 'Unit testing'));
      const enBd = await Conocimiento.findById(conocimiento._id).lean();
      expect(enBd.titulo).toEqual(loc('Pruebas unitarias', 'Unit testing'));
    });

    it('con titulo string devuelve 500 y conserva el anterior', async () => {
      const conocimiento = await crearConocimientoEnBd();

      await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: 'Vue' })
        .expect(500);

      const enBd = await Conocimiento.findById(conocimiento._id).lean();
      expect(enBd.titulo).toEqual(loc('React'));
    });

    it('con un id inexistente devuelve 404', async () => {
      const { body } = await request(app)
        .put(`/api/conocimiento/${new Types.ObjectId()}`)
        .set('x-token', token)
        .send({ titulo: loc('Vue'), prioridad: 'muyBaja' })
        .expect(404);

      expect(body).toEqual({ msg: 'Conocimiento no encontrado' });
    });

    it('sin prioridad conserva la actual', async () => {
      const conocimiento = await crearConocimientoEnBd({ prioridad: 'alta' });

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('Vue') })
        .expect(200);

      expect(body.prioridad).toBe('alta');
      const enBd = await Conocimiento.findById(conocimiento._id);
      expect(enBd.prioridad).toBe('alta');
    });

    it('con una prioridad fuera del enum devuelve 500 y conserva la anterior', async () => {
      const conocimiento = await crearConocimientoEnBd({ prioridad: 'alta' });

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('Vue'), prioridad: 'Urgente' })
        .expect(500);

      expect(body).toEqual({ msg: 'Error al actualizar el conocimiento' });
      const enBd = await Conocimiento.findById(conocimiento._id);
      expect(enBd.titulo.es).toBe('React');
      expect(enBd.prioridad).toBe('alta');
    });

    it('sin icono conserva el actual', async () => {
      const conocimiento = await crearConocimientoEnBd({ icono: ICONO });

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('Vue') })
        .expect(200);

      expect(body.icono).toBe(ICONO);
      const enBd = await Conocimiento.findById(conocimiento._id).lean();
      expect(enBd.icono).toBe(ICONO);
    });

    it('con icono vacio lo quita', async () => {
      const conocimiento = await crearConocimientoEnBd({ icono: ICONO });

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('React'), icono: '' })
        .expect(200);

      expect(body.icono).toBe('');
      const enBd = await Conocimiento.findById(conocimiento._id).lean();
      expect(enBd.icono).toBe('');
    });

    it('con un SVG valido lo sustituye', async () => {
      const conocimiento = await crearConocimientoEnBd({ icono: ICONO });

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('React'), icono: OTRO_ICONO })
        .expect(200);

      expect(body.icono).toBe(OTRO_ICONO);
      const enBd = await Conocimiento.findById(conocimiento._id).lean();
      expect(enBd.icono).toBe(OTRO_ICONO);
    });

    it('con <script> devuelve 400 y el documento no cambia', async () => {
      const conocimiento = await crearConocimientoEnBd({ icono: ICONO });

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('Vue'), prioridad: 'alta', icono: ICONO_SCRIPT })
        .expect(400);

      expect(body).toEqual(ICONO_NO_VALIDO);
      const enBd = await Conocimiento.findById(conocimiento._id).lean();
      expect(enBd.titulo).toEqual(loc('React'));
      expect(enBd.prioridad).toBe('media');
      expect(enBd.icono).toBe(ICONO);
    });

    it('con nivel en el body lo ignora', async () => {
      const conocimiento = await crearConocimientoEnBd();

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: loc('Vue'), nivel: 'Avanzado' })
        .expect(200);

      expect(body).not.toHaveProperty('nivel');
      const enBd = await Conocimiento.findById(conocimiento._id).lean();
      expect(enBd).not.toHaveProperty('nivel');
    });
  });

  describe('DELETE /api/conocimiento/:id', () => {
    it('con token devuelve 200 con el id y lo borra de la base', async () => {
      const conocimiento = await crearConocimientoEnBd();

      const { body } = await request(app)
        .delete(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .expect(200);

      expect(body).toEqual({
        msg: 'Conocimiento eliminado',
        id: conocimiento._id.toString(),
      });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });

    it('sin token devuelve 401 y el documento sigue en la base', async () => {
      const conocimiento = await crearConocimientoEnBd();

      const { body } = await request(app)
        .delete(`/api/conocimiento/${conocimiento._id}`)
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(1);
    });
  });
});

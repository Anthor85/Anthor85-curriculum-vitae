/* global describe, it, expect, beforeEach */
const { Types } = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Conocimiento = require('../../models/Conocimiento');
const { crearConocimientoEnBd } = require('../utils/fixtures');
const { tokenValido } = require('../utils/token');

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
        titulo: 'Node',
        prioridad: 'baja',
      });

      const { body } = await request(app).get('/api/conocimiento').expect(200);

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: conocimiento._id.toString(),
        titulo: 'Node',
        prioridad: 'baja',
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
        .send({ titulo: 'React', prioridad: 'alta' })
        .expect(201);

      expect(body).toEqual({
        id: expect.any(String),
        titulo: 'React',
        prioridad: 'alta',
      });
      await expect(Conocimiento.countDocuments()).resolves.toBe(1);
    });

    it('sin token devuelve 401 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .send({ titulo: 'React', prioridad: 'alta' })
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });

    it('con una prioridad fuera del enum devuelve 500 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: 'React', prioridad: 'Experto' })
        .expect(500);

      expect(body).toEqual({ msg: 'Error al crear el conocimiento' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });

    it('con una prioridad antigua en texto devuelve 500 y con su clave 201', async () => {
      const antigua = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: 'React', prioridad: 'Alta' })
        .expect(500);

      expect(antigua.body).toEqual({ msg: 'Error al crear el conocimiento' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);

      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: 'React', prioridad: 'alta' })
        .expect(201);

      expect(body.prioridad).toBe('alta');
    });

    it('sin prioridad devuelve 201 con prioridad media', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: 'React' })
        .expect(201);

      expect(body.prioridad).toBe('media');
    });

    it.each(['muyAlta', 'alta', 'media', 'baja', 'muyBaja'])(
      'con prioridad %s devuelve 201 y la devuelve',
      async (prioridad) => {
        const { body } = await request(app)
          .post('/api/conocimiento')
          .set('x-token', token)
          .send({ titulo: 'React', prioridad })
          .expect(201);

        expect(body.prioridad).toBe(prioridad);
      },
    );

    it('con nivel y sin prioridad devuelve 201 e ignora nivel', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: 'React', nivel: 'Avanzado' })
        .expect(201);

      expect(body).not.toHaveProperty('nivel');
      const enBd = await Conocimiento.findById(body.id).lean();
      expect(enBd).not.toHaveProperty('nivel');
    });
  });

  describe('POST /api/conocimiento/multiple', () => {
    it('con token y un array de dos devuelve 201 y deja dos en la base', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento/multiple')
        .set('x-token', token)
        .send([
          { titulo: 'React', prioridad: 'alta' },
          { titulo: 'Node', prioridad: 'baja' },
        ])
        .expect(201);

      expect(body).toHaveLength(2);
      expect(body.map(({ titulo }) => titulo)).toEqual(['React', 'Node']);
      await expect(Conocimiento.countDocuments()).resolves.toBe(2);
    });

    it('sin prioridad guarda media en todos', async () => {
      await request(app)
        .post('/api/conocimiento/multiple')
        .set('x-token', token)
        .send([{ titulo: 'React' }, { titulo: 'Node' }])
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
        .send({ titulo: 'Vue', prioridad: 'muyBaja' })
        .expect(200);

      expect(body).toEqual({
        id: conocimiento._id.toString(),
        titulo: 'Vue',
        prioridad: 'muyBaja',
      });
      const enBd = await Conocimiento.findById(conocimiento._id);
      expect(enBd.titulo).toBe('Vue');
      expect(enBd.prioridad).toBe('muyBaja');
    });

    it('con un id inexistente devuelve 404', async () => {
      const { body } = await request(app)
        .put(`/api/conocimiento/${new Types.ObjectId()}`)
        .set('x-token', token)
        .send({ titulo: 'Vue', prioridad: 'muyBaja' })
        .expect(404);

      expect(body).toEqual({ msg: 'Conocimiento no encontrado' });
    });

    it('sin prioridad conserva la actual', async () => {
      const conocimiento = await crearConocimientoEnBd({ prioridad: 'alta' });

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: 'Vue' })
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
        .send({ titulo: 'Vue', prioridad: 'Urgente' })
        .expect(500);

      expect(body).toEqual({ msg: 'Error al actualizar el conocimiento' });
      const enBd = await Conocimiento.findById(conocimiento._id);
      expect(enBd.titulo).toBe('React');
      expect(enBd.prioridad).toBe('alta');
    });

    it('con nivel en el body lo ignora', async () => {
      const conocimiento = await crearConocimientoEnBd();

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: 'Vue', nivel: 'Avanzado' })
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

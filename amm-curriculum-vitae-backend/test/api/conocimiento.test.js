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
        nivel: 'Intermedio',
      });

      const { body } = await request(app).get('/api/conocimiento').expect(200);

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: conocimiento._id.toString(),
        titulo: 'Node',
        nivel: 'Intermedio',
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
        .send({ titulo: 'React', nivel: 'Avanzado' })
        .expect(201);

      expect(body).toEqual({
        id: expect.any(String),
        titulo: 'React',
        nivel: 'Avanzado',
      });
      await expect(Conocimiento.countDocuments()).resolves.toBe(1);
    });

    it('sin token devuelve 401 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .send({ titulo: 'React', nivel: 'Avanzado' })
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });

    it('con un nivel fuera del enum devuelve 500 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento')
        .set('x-token', token)
        .send({ titulo: 'React', nivel: 'Experto' })
        .expect(500);

      expect(body).toEqual({ msg: 'Error al crear el conocimiento' });
      await expect(Conocimiento.countDocuments()).resolves.toBe(0);
    });
  });

  describe('POST /api/conocimiento/multiple', () => {
    it('con token y un array de dos devuelve 201 y deja dos en la base', async () => {
      const { body } = await request(app)
        .post('/api/conocimiento/multiple')
        .set('x-token', token)
        .send([
          { titulo: 'React', nivel: 'Avanzado' },
          { titulo: 'Node', nivel: 'Intermedio' },
        ])
        .expect(201);

      expect(body).toHaveLength(2);
      expect(body.map(({ titulo }) => titulo)).toEqual(['React', 'Node']);
      await expect(Conocimiento.countDocuments()).resolves.toBe(2);
    });
  });

  describe('PUT /api/conocimiento/:id', () => {
    it('con token actualiza titulo y nivel y devuelve el documento actualizado', async () => {
      const conocimiento = await crearConocimientoEnBd();

      const { body } = await request(app)
        .put(`/api/conocimiento/${conocimiento._id}`)
        .set('x-token', token)
        .send({ titulo: 'Vue', nivel: 'Básico' })
        .expect(200);

      expect(body).toEqual({
        id: conocimiento._id.toString(),
        titulo: 'Vue',
        nivel: 'Básico',
      });
      const enBd = await Conocimiento.findById(conocimiento._id);
      expect(enBd.titulo).toBe('Vue');
      expect(enBd.nivel).toBe('Básico');
    });

    it('con un id inexistente devuelve 404', async () => {
      const { body } = await request(app)
        .put(`/api/conocimiento/${new Types.ObjectId()}`)
        .set('x-token', token)
        .send({ titulo: 'Vue', nivel: 'Básico' })
        .expect(404);

      expect(body).toEqual({ msg: 'Conocimiento no encontrado' });
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

/* global describe, it, expect, beforeEach */
const { Types } = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Formacion = require('../../models/Formacion');
const { crearFormacionEnBd } = require('../utils/fixtures');
const { tokenValido } = require('../utils/token');

describe('/api/formacion', () => {
  let token;

  beforeEach(() => {
    token = tokenValido(new Types.ObjectId().toString());
  });

  describe('GET /api/formacion', () => {
    it('devuelve 200 y un array vacio con la base vacia', async () => {
      const { body } = await request(app).get('/api/formacion').expect(200);

      expect(body).toEqual([]);
    });

    it('devuelve las formaciones sembradas con id y sin _id ni __v', async () => {
      const formacion = await crearFormacionEnBd();

      const { body } = await request(app).get('/api/formacion').expect(200);

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: formacion._id.toString(),
        titulo: 'Ingenieria Informatica',
        institucion: 'Universidad de test',
        fechaFin: '2015-06-30T00:00:00.000Z',
      });
      expect(body[0]).not.toHaveProperty('_id');
      expect(body[0]).not.toHaveProperty('__v');
    });
  });

  describe('POST /api/formacion', () => {
    it('con token devuelve 201 y deja el documento en la base', async () => {
      const { body } = await request(app)
        .post('/api/formacion')
        .set('x-token', token)
        .send({
          titulo: 'Grado en Informatica',
          institucion: 'Universidad de Valencia',
          descripcion: 'Rama de software',
          fechaFin: '2015-06-30',
        })
        .expect(201);

      expect(body).toEqual({
        id: expect.any(String),
        titulo: 'Grado en Informatica',
        institucion: 'Universidad de Valencia',
        descripcion: 'Rama de software',
        fechaFin: '2015-06-30T00:00:00.000Z',
      });
      await expect(Formacion.countDocuments()).resolves.toBe(1);
    });

    it('sin token devuelve 401 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/formacion')
        .send({
          titulo: 'Grado en Informatica',
          institucion: 'Universidad de Valencia',
          fechaFin: '2015-06-30',
        })
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      await expect(Formacion.countDocuments()).resolves.toBe(0);
    });

    it('sin fechaFin devuelve 500 con el mensaje de contexto del controlador', async () => {
      const { body } = await request(app)
        .post('/api/formacion')
        .set('x-token', token)
        .send({
          titulo: 'Grado en Informatica',
          institucion: 'Universidad de Valencia',
        })
        .expect(500);

      expect(body).toEqual({ msg: 'Error al crear la formación' });
      await expect(Formacion.countDocuments()).resolves.toBe(0);
    });
  });

  describe('PUT /api/formacion/:id', () => {
    it('con token actualiza los campos y devuelve el documento actualizado', async () => {
      const formacion = await crearFormacionEnBd();

      const { body } = await request(app)
        .put(`/api/formacion/${formacion._id}`)
        .set('x-token', token)
        .send({
          titulo: 'Master en Ingenieria del Software',
          institucion: 'Universidad Politecnica',
          descripcion: 'Especialidad en web',
          fechaFin: '2018-09-15',
        })
        .expect(200);

      expect(body).toEqual({
        id: formacion._id.toString(),
        titulo: 'Master en Ingenieria del Software',
        institucion: 'Universidad Politecnica',
        descripcion: 'Especialidad en web',
        fechaFin: '2018-09-15T00:00:00.000Z',
      });
      const enBd = await Formacion.findById(formacion._id);
      expect(enBd.titulo).toBe('Master en Ingenieria del Software');
      expect(enBd.fechaFin.toISOString()).toBe('2018-09-15T00:00:00.000Z');
    });

    it('con un id inexistente devuelve 404', async () => {
      const { body } = await request(app)
        .put(`/api/formacion/${new Types.ObjectId()}`)
        .set('x-token', token)
        .send({
          titulo: 'Master',
          institucion: 'Universidad Politecnica',
          fechaFin: '2018-09-15',
        })
        .expect(404);

      expect(body).toEqual({ msg: 'Formación no encontrada' });
    });
  });

  describe('DELETE /api/formacion/:id', () => {
    it('con token borra el documento y sin token devuelve 401 sin borrarlo', async () => {
      const formacion = await crearFormacionEnBd();

      const sinToken = await request(app)
        .delete(`/api/formacion/${formacion._id}`)
        .expect(401);

      expect(sinToken.body).toEqual({ msg: 'No hay token en la petición' });
      await expect(Formacion.countDocuments()).resolves.toBe(1);

      const conToken = await request(app)
        .delete(`/api/formacion/${formacion._id}`)
        .set('x-token', token)
        .expect(200);

      expect(conToken.body.msg).toBe('Formación eliminada');
      expect(conToken.body.formacion.id).toBe(formacion._id.toString());
      await expect(Formacion.countDocuments()).resolves.toBe(0);
    });
  });
});

/* global describe, it, expect, beforeEach */
const { Types } = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const FormacionComplementaria = require('../../models/FormacionComplementaria');
const { crearFormacionComplementariaEnBd } = require('../utils/fixtures');
const { tokenValido } = require('../utils/token');

describe('/api/formacionComplementaria', () => {
  let token;

  beforeEach(() => {
    token = tokenValido(new Types.ObjectId().toString());
  });

  describe('GET /api/formacionComplementaria', () => {
    it('devuelve 200 y un array vacio con la base vacia', async () => {
      const { body } = await request(app)
        .get('/api/formacionComplementaria')
        .expect(200);

      expect(body).toEqual([]);
    });

    it('devuelve las formaciones complementarias sembradas con id y sin _id ni __v', async () => {
      const formacion = await crearFormacionComplementariaEnBd();

      const { body } = await request(app)
        .get('/api/formacionComplementaria')
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: formacion._id.toString(),
        titulo: { es: 'Curso de React', en: 'React course' },
        institucion: { es: 'Academia de test', en: 'Test academy' },
      });
      expect(body[0]).not.toHaveProperty('_id');
      expect(body[0]).not.toHaveProperty('__v');
    });
  });

  describe('POST /api/formacionComplementaria', () => {
    it('con token devuelve 201 y deja el documento en la base', async () => {
      const { body } = await request(app)
        .post('/api/formacionComplementaria')
        .set('x-token', token)
        .send({
          titulo: { es: 'Curso de Node', en: 'Node course' },
          institucion: { es: 'Platzi', en: 'Platzi' },
          fechaFin: '2021-03-01',
        })
        .expect(201);

      expect(body).toEqual({
        id: expect.any(String),
        titulo: { es: 'Curso de Node', en: 'Node course' },
        institucion: { es: 'Platzi', en: 'Platzi' },
        fechaFin: '2021-03-01T00:00:00.000Z',
      });
      await expect(FormacionComplementaria.countDocuments()).resolves.toBe(1);
    });

    it('sin en guarda en vacio', async () => {
      const { body } = await request(app)
        .post('/api/formacionComplementaria')
        .set('x-token', token)
        .send({
          titulo: { es: 'Curso de Node' },
          institucion: { es: 'Platzi' },
        })
        .expect(201);

      expect(body.titulo).toEqual({ es: 'Curso de Node', en: '' });
      expect(body.institucion).toEqual({ es: 'Platzi', en: '' });
      const enBd = await FormacionComplementaria.findById(body.id);
      expect(enBd.titulo.en).toBe('');
    });

    it('con un string en un campo localizado devuelve 500 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/formacionComplementaria')
        .set('x-token', token)
        .send({ titulo: 'Curso de Node', institucion: { es: 'Platzi' } })
        .expect(500);

      expect(body).toEqual({
        msg: 'Error al crear la formación complementaria',
      });
      await expect(FormacionComplementaria.countDocuments()).resolves.toBe(0);
    });

    it('con es vacio devuelve 500 y no crea nada', async () => {
      await request(app)
        .post('/api/formacionComplementaria')
        .set('x-token', token)
        .send({ titulo: { es: '  ', en: 'Course' }, institucion: { es: 'P' } })
        .expect(500);

      await expect(FormacionComplementaria.countDocuments()).resolves.toBe(0);
    });

    it('sin token devuelve 401 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/formacionComplementaria')
        .send({
          titulo: { es: 'Curso de Node' },
          institucion: { es: 'Platzi' },
        })
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      await expect(FormacionComplementaria.countDocuments()).resolves.toBe(0);
    });

    it('sin institucion devuelve 500 con el mensaje de contexto del controlador', async () => {
      const { body } = await request(app)
        .post('/api/formacionComplementaria')
        .set('x-token', token)
        .send({ titulo: { es: 'Curso de Node' } })
        .expect(500);

      expect(body).toEqual({
        msg: 'Error al crear la formación complementaria',
      });
      await expect(FormacionComplementaria.countDocuments()).resolves.toBe(0);
    });
  });

  describe('PUT /api/formacionComplementaria/:id', () => {
    it('con token actualiza los campos y devuelve el documento actualizado', async () => {
      const formacion = await crearFormacionComplementariaEnBd();

      const { body } = await request(app)
        .put(`/api/formacionComplementaria/${formacion._id}`)
        .set('x-token', token)
        .send({
          titulo: { es: 'Curso de TypeScript', en: 'TypeScript course' },
          institucion: { es: 'Udemy', en: 'Udemy' },
          fechaFin: '2022-11-20',
        })
        .expect(200);

      expect(body).toEqual({
        id: formacion._id.toString(),
        titulo: { es: 'Curso de TypeScript', en: 'TypeScript course' },
        institucion: { es: 'Udemy', en: 'Udemy' },
        fechaFin: '2022-11-20T00:00:00.000Z',
      });
      const enBd = await FormacionComplementaria.findById(formacion._id);
      expect(enBd.titulo.es).toBe('Curso de TypeScript');
      expect(enBd.institucion.es).toBe('Udemy');
    });

    it('cambiando solo en conserva es', async () => {
      const formacion = await crearFormacionComplementariaEnBd();

      const { body } = await request(app)
        .put(`/api/formacionComplementaria/${formacion._id}`)
        .set('x-token', token)
        .send({
          titulo: { es: 'Curso de React', en: 'React.js course' },
          institucion: { es: 'Academia de test', en: 'Test academy' },
        })
        .expect(200);

      expect(body.titulo).toEqual({
        es: 'Curso de React',
        en: 'React.js course',
      });
      const enBd = await FormacionComplementaria.findById(formacion._id);
      expect(enBd.titulo.es).toBe('Curso de React');
      expect(enBd.titulo.en).toBe('React.js course');
    });

    it('con un id inexistente devuelve 404', async () => {
      const { body } = await request(app)
        .put(`/api/formacionComplementaria/${new Types.ObjectId()}`)
        .set('x-token', token)
        .send({
          titulo: { es: 'Curso de TypeScript' },
          institucion: { es: 'Udemy' },
        })
        .expect(404);

      expect(body).toEqual({ msg: 'Formación complementaria no encontrada' });
    });
  });

  describe('DELETE /api/formacionComplementaria/:id', () => {
    it('con token borra el documento y sin token devuelve 401 sin borrarlo', async () => {
      const formacion = await crearFormacionComplementariaEnBd();

      const sinToken = await request(app)
        .delete(`/api/formacionComplementaria/${formacion._id}`)
        .expect(401);

      expect(sinToken.body).toEqual({ msg: 'No hay token en la petición' });
      await expect(FormacionComplementaria.countDocuments()).resolves.toBe(1);

      const conToken = await request(app)
        .delete(`/api/formacionComplementaria/${formacion._id}`)
        .set('x-token', token)
        .expect(200);

      expect(conToken.body.msg).toBe('Formación eliminada');
      expect(conToken.body.formacionComplementaria.id).toBe(
        formacion._id.toString(),
      );
      await expect(FormacionComplementaria.countDocuments()).resolves.toBe(0);
    });
  });
});

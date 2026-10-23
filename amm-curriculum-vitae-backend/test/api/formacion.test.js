/* global describe, it, expect, beforeEach */
const { Types } = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Extra = require('../../models/Extra');
const Formacion = require('../../models/Formacion');
const { crearExtraEnBd, crearFormacionEnBd } = require('../utils/fixtures');
const { tokenValido } = require('../utils/token');

const formacionValida = {
  titulo: 'Grado en Informatica',
  institucion: 'Universidad de Valencia',
  fechaFin: '2015-06-30',
};

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

    it('devuelve las formaciones sembradas con id, extras y sin _id ni __v', async () => {
      const formacion = await crearFormacionEnBd();

      const { body } = await request(app).get('/api/formacion').expect(200);

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: formacion._id.toString(),
        titulo: 'Ingenieria Informatica',
        institucion: 'Universidad de test',
        fechaFin: '2015-06-30T00:00:00.000Z',
        extras: [],
      });
      expect(body[0]).not.toHaveProperty('_id');
      expect(body[0]).not.toHaveProperty('__v');
    });

    it('devuelve las formaciones con sus extras poblados', async () => {
      const formacion = await crearFormacionEnBd();
      const extra = await crearExtraEnBd(formacion._id, {
        descripcion: 'Rama de software',
      });

      const { body } = await request(app).get('/api/formacion').expect(200);

      expect(body[0].extras).toHaveLength(1);
      expect(body[0].extras[0]).toMatchObject({
        id: extra._id.toString(),
        descripcion: 'Rama de software',
      });
      expect(body[0].extras[0]).not.toHaveProperty('_id');
    });
  });

  describe('POST /api/formacion', () => {
    it('con token y sin extras devuelve 201 con extras vacios', async () => {
      const { body } = await request(app)
        .post('/api/formacion')
        .set('x-token', token)
        .send(formacionValida)
        .expect(201);

      expect(body).toEqual({
        id: expect.any(String),
        titulo: 'Grado en Informatica',
        institucion: 'Universidad de Valencia',
        fechaFin: '2015-06-30T00:00:00.000Z',
        extras: [],
      });
      await expect(Formacion.countDocuments()).resolves.toBe(1);
      await expect(Extra.countDocuments()).resolves.toBe(0);
    });

    it('crea un Extra por cada descripcion no vacia, ignorando los id recibidos', async () => {
      const idInventado = new Types.ObjectId().toString();

      const { body } = await request(app)
        .post('/api/formacion')
        .set('x-token', token)
        .send({
          ...formacionValida,
          extras: [
            { id: idInventado, descripcion: 'Rama de software' },
            { descripcion: 'Premio extraordinario' },
            { descripcion: '   ' },
          ],
        })
        .expect(201);

      expect(body.extras.map(({ descripcion }) => descripcion).sort()).toEqual([
        'Premio extraordinario',
        'Rama de software',
      ]);
      expect(body.extras.map(({ id }) => id)).not.toContain(idInventado);

      const extrasEnBd = await Extra.find({ formacion: body.id });
      expect(extrasEnBd).toHaveLength(2);
    });

    it('sin token devuelve 401 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/formacion')
        .send(formacionValida)
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
          fechaFin: '2018-09-15',
        })
        .expect(200);

      expect(body).toEqual({
        id: formacion._id.toString(),
        titulo: 'Master en Ingenieria del Software',
        institucion: 'Universidad Politecnica',
        fechaFin: '2018-09-15T00:00:00.000Z',
        extras: [],
      });
      const enBd = await Formacion.findById(formacion._id);
      expect(enBd.titulo).toBe('Master en Ingenieria del Software');
      expect(enBd.fechaFin.toISOString()).toBe('2018-09-15T00:00:00.000Z');
    });

    it('reconcilia los extras: conserva el reenviado, crea el nuevo y borra el que ya no viene', async () => {
      const formacion = await crearFormacionEnBd();
      const seQueda = await crearExtraEnBd(formacion._id, {
        descripcion: 'Original',
      });
      const seVa = await crearExtraEnBd(formacion._id, {
        descripcion: 'Sobra',
      });

      const { body } = await request(app)
        .put(`/api/formacion/${formacion._id}`)
        .set('x-token', token)
        .send({
          ...formacionValida,
          extras: [
            { id: seQueda._id.toString(), descripcion: 'Editado' },
            { descripcion: 'Nuevo' },
          ],
        })
        .expect(200);

      expect(body.extras).toHaveLength(2);
      expect(body.extras).toContainEqual(
        expect.objectContaining({
          id: seQueda._id.toString(),
          descripcion: 'Editado',
        }),
      );
      expect(body.extras).toContainEqual(
        expect.objectContaining({ descripcion: 'Nuevo' }),
      );
      await expect(Extra.findById(seVa._id)).resolves.toBeNull();
    });

    it('descarta el id de un extra de otra formacion y crea uno nuevo', async () => {
      const formacion = await crearFormacionEnBd();
      const otra = await crearFormacionEnBd({ titulo: 'Otra' });
      const ajeno = await crearExtraEnBd(otra._id, { descripcion: 'Ajeno' });

      const { body } = await request(app)
        .put(`/api/formacion/${formacion._id}`)
        .set('x-token', token)
        .send({
          ...formacionValida,
          extras: [{ id: ajeno._id.toString(), descripcion: 'Robado' }],
        })
        .expect(200);

      expect(body.extras).toHaveLength(1);
      expect(body.extras[0].id).not.toBe(ajeno._id.toString());
      const ajenoEnBd = await Extra.findById(ajeno._id);
      expect(ajenoEnBd.descripcion).toBe('Ajeno');
      expect(ajenoEnBd.formacion.toString()).toBe(otra._id.toString());
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

    it('borra en cascada sus extras sin tocar los de otra formacion', async () => {
      const formacion = await crearFormacionEnBd();
      const otra = await crearFormacionEnBd({ titulo: 'Otra' });
      await crearExtraEnBd(formacion._id);
      await crearExtraEnBd(formacion._id);
      await crearExtraEnBd(otra._id);

      const { body } = await request(app)
        .delete(`/api/formacion/${formacion._id}`)
        .set('x-token', token)
        .expect(200);

      expect(body.extrasEliminados).toBe(2);
      await expect(Extra.countDocuments({ formacion: otra._id })).resolves.toBe(
        1,
      );
      await expect(Extra.countDocuments()).resolves.toBe(1);
    });
  });
});

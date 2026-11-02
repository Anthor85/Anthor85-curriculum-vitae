/* global describe, it, expect, beforeEach */
const { Types } = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Extra = require('../../models/Extra');
const Formacion = require('../../models/Formacion');
const { crearExtraEnBd, crearFormacionEnBd } = require('../utils/fixtures');
const { tokenValido } = require('../utils/token');

const formacionValida = {
  titulo: { es: 'Grado en Informatica', en: 'BSc in Computer Science' },
  institucion: { es: 'Universidad de Valencia', en: 'University of Valencia' },
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
        titulo: { es: 'Ingenieria Informatica', en: 'Computer Engineering' },
        institucion: { es: 'Universidad de test', en: 'Test University' },
        fechaFin: '2015-06-30T00:00:00.000Z',
        extras: [],
      });
      expect(body[0]).not.toHaveProperty('_id');
      expect(body[0]).not.toHaveProperty('__v');
    });

    it('devuelve las formaciones con sus extras poblados', async () => {
      const formacion = await crearFormacionEnBd();
      const extra = await crearExtraEnBd(formacion._id, {
        descripcion: { es: 'Rama de software', en: 'Software track' },
      });

      const { body } = await request(app).get('/api/formacion').expect(200);

      expect(body[0].extras).toHaveLength(1);
      expect(body[0].extras[0]).toMatchObject({
        id: extra._id.toString(),
        descripcion: { es: 'Rama de software', en: 'Software track' },
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
        titulo: { es: 'Grado en Informatica', en: 'BSc in Computer Science' },
        institucion: {
          es: 'Universidad de Valencia',
          en: 'University of Valencia',
        },
        fechaFin: '2015-06-30T00:00:00.000Z',
        extras: [],
      });
      await expect(Formacion.countDocuments()).resolves.toBe(1);
      await expect(Extra.countDocuments()).resolves.toBe(0);
    });

    it('crea un Extra por cada descripcion con es no vacio, ignorando los id recibidos', async () => {
      const idInventado = new Types.ObjectId().toString();

      const { body } = await request(app)
        .post('/api/formacion')
        .set('x-token', token)
        .send({
          ...formacionValida,
          extras: [
            {
              id: idInventado,
              descripcion: { es: 'Rama de software', en: 'Software track' },
            },
            { descripcion: { es: 'Premio extraordinario' } },
            { descripcion: { es: '   ', en: 'Only English' } },
          ],
        })
        .expect(201);

      expect(body.extras.map(({ descripcion }) => descripcion)).toEqual(
        expect.arrayContaining([
          { es: 'Rama de software', en: 'Software track' },
          { es: 'Premio extraordinario', en: '' },
        ]),
      );
      expect(body.extras.map(({ id }) => id)).not.toContain(idInventado);

      const extrasEnBd = await Extra.find({ formacion: body.id });
      expect(extrasEnBd).toHaveLength(2);
    });

    it('sin en en titulo e institucion guarda en vacio', async () => {
      const { body } = await request(app)
        .post('/api/formacion')
        .set('x-token', token)
        .send({
          ...formacionValida,
          titulo: { es: 'Grado en Informatica' },
          institucion: { es: 'Universidad de Valencia' },
        })
        .expect(201);

      expect(body.titulo).toEqual({ es: 'Grado en Informatica', en: '' });
      expect(body.institucion).toEqual({
        es: 'Universidad de Valencia',
        en: '',
      });
    });

    it('con un string en el titulo devuelve 500 y no crea nada', async () => {
      const { body } = await request(app)
        .post('/api/formacion')
        .set('x-token', token)
        .send({ ...formacionValida, titulo: 'Grado en Informatica' })
        .expect(500);

      expect(body).toEqual({ msg: 'Error al crear la formación' });
      await expect(Formacion.countDocuments()).resolves.toBe(0);
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
          titulo: formacionValida.titulo,
          institucion: formacionValida.institucion,
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
          titulo: {
            es: 'Master en Ingenieria del Software',
            en: 'MSc in Software Engineering',
          },
          institucion: { es: 'Universidad Politecnica', en: '' },
          fechaFin: '2018-09-15',
        })
        .expect(200);

      expect(body).toEqual({
        id: formacion._id.toString(),
        titulo: {
          es: 'Master en Ingenieria del Software',
          en: 'MSc in Software Engineering',
        },
        institucion: { es: 'Universidad Politecnica', en: '' },
        fechaFin: '2018-09-15T00:00:00.000Z',
        extras: [],
      });
      const enBd = await Formacion.findById(formacion._id);
      expect(enBd.titulo.es).toBe('Master en Ingenieria del Software');
      expect(enBd.fechaFin.toISOString()).toBe('2018-09-15T00:00:00.000Z');
    });

    it('cambiando solo en del titulo conserva es', async () => {
      const formacion = await crearFormacionEnBd();

      const { body } = await request(app)
        .put(`/api/formacion/${formacion._id}`)
        .set('x-token', token)
        .send({
          titulo: { es: 'Ingenieria Informatica', en: 'BEng in Computing' },
          institucion: { es: 'Universidad de test', en: 'Test University' },
          fechaFin: '2015-06-30',
        })
        .expect(200);

      expect(body.titulo).toEqual({
        es: 'Ingenieria Informatica',
        en: 'BEng in Computing',
      });
      const enBd = await Formacion.findById(formacion._id);
      expect(enBd.titulo.es).toBe('Ingenieria Informatica');
      expect(enBd.titulo.en).toBe('BEng in Computing');
    });

    it('reconcilia los extras: conserva el reenviado, crea el nuevo y borra el que ya no viene', async () => {
      const formacion = await crearFormacionEnBd();
      const seQueda = await crearExtraEnBd(formacion._id, {
        descripcion: { es: 'Original', en: '' },
      });
      const seVa = await crearExtraEnBd(formacion._id, {
        descripcion: { es: 'Sobra', en: '' },
      });

      const { body } = await request(app)
        .put(`/api/formacion/${formacion._id}`)
        .set('x-token', token)
        .send({
          ...formacionValida,
          extras: [
            {
              id: seQueda._id.toString(),
              descripcion: { es: 'Editado', en: 'Edited' },
            },
            { descripcion: { es: 'Nuevo', en: '' } },
          ],
        })
        .expect(200);

      expect(body.extras).toHaveLength(2);
      expect(body.extras).toContainEqual(
        expect.objectContaining({
          id: seQueda._id.toString(),
          descripcion: { es: 'Editado', en: 'Edited' },
        }),
      );
      expect(body.extras).toContainEqual(
        expect.objectContaining({ descripcion: { es: 'Nuevo', en: '' } }),
      );
      await expect(Extra.findById(seVa._id)).resolves.toBeNull();
    });

    it('descarta el id de un extra de otra formacion y crea uno nuevo', async () => {
      const formacion = await crearFormacionEnBd();
      const otra = await crearFormacionEnBd({ titulo: { es: 'Otra' } });
      const ajeno = await crearExtraEnBd(otra._id, {
        descripcion: { es: 'Ajeno', en: '' },
      });

      const { body } = await request(app)
        .put(`/api/formacion/${formacion._id}`)
        .set('x-token', token)
        .send({
          ...formacionValida,
          extras: [
            { id: ajeno._id.toString(), descripcion: { es: 'Robado', en: '' } },
          ],
        })
        .expect(200);

      expect(body.extras).toHaveLength(1);
      expect(body.extras[0].id).not.toBe(ajeno._id.toString());
      const ajenoEnBd = await Extra.findById(ajeno._id);
      expect(ajenoEnBd.descripcion.es).toBe('Ajeno');
      expect(ajenoEnBd.formacion.toString()).toBe(otra._id.toString());
    });

    it('con un id inexistente devuelve 404', async () => {
      const { body } = await request(app)
        .put(`/api/formacion/${new Types.ObjectId()}`)
        .set('x-token', token)
        .send(formacionValida)
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
      const otra = await crearFormacionEnBd({ titulo: { es: 'Otra' } });
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

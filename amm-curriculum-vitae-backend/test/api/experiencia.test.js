/* global describe, it, expect, beforeEach */
const { Types } = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Experiencia = require('../../models/Experiencia');
const Hito = require('../../models/Hito');
const { crearExperienciaEnBd, crearHitoEnBd } = require('../utils/fixtures');
const { tokenValido } = require('../utils/token');

const experienciaValida = {
  empresa: 'Empresa nueva',
  descripcion: 'Desarrollo de aplicaciones web',
  fechaInicio: '2020-01-01',
  fechaFin: '2022-12-31',
};

describe('/api/experiencia', () => {
  let token;

  beforeEach(() => {
    token = tokenValido(new Types.ObjectId().toString());
  });

  describe('GET /api/experiencia', () => {
    it('devuelve 200 y un array vacio con la base vacia', async () => {
      const { body } = await request(app).get('/api/experiencia').expect(200);

      expect(body).toEqual([]);
    });

    it('devuelve las experiencias con sus hitos poblados', async () => {
      const experiencia = await crearExperienciaEnBd();
      const hito = await crearHitoEnBd(experiencia._id, {
        descripcion: 'Migracion a React',
      });

      const { body } = await request(app).get('/api/experiencia').expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].id).toBe(experiencia._id.toString());
      expect(body[0]).not.toHaveProperty('_id');
      expect(body[0]).not.toHaveProperty('__v');
      expect(body[0].hitos).toHaveLength(1);
      expect(body[0].hitos[0]).toMatchObject({
        id: hito._id.toString(),
        descripcion: 'Migracion a React',
      });
      expect(body[0].hitos[0]).not.toHaveProperty('_id');
    });
  });

  describe('POST /api/experiencia', () => {
    it('con token y sin hitos devuelve 201 con hitos vacios', async () => {
      const { body } = await request(app)
        .post('/api/experiencia')
        .set('x-token', token)
        .send(experienciaValida)
        .expect(201);

      expect(body).toMatchObject({
        id: expect.any(String),
        empresa: 'Empresa nueva',
        descripcion: 'Desarrollo de aplicaciones web',
        hitos: [],
        tecnologias: [],
      });
      expect(new Date(body.fechaInicio).toISOString()).toBe(
        '2020-01-01T00:00:00.000Z',
      );
      await expect(Hito.countDocuments()).resolves.toBe(0);
    });

    it('con hitos como array de cadenas crea un Hito por cada una', async () => {
      const { body } = await request(app)
        .post('/api/experiencia')
        .set('x-token', token)
        .send({ ...experienciaValida, hitos: ['Primero', 'Segundo'] })
        .expect(201);

      expect(body.hitos).toHaveLength(2);
      expect(body.hitos.map(({ descripcion }) => descripcion).sort()).toEqual([
        'Primero',
        'Segundo',
      ]);

      const hitosEnBd = await Hito.find({ experiencia: body.id });
      expect(hitosEnBd).toHaveLength(2);
      hitosEnBd.forEach((hito) => {
        expect(hito.experiencia.toString()).toBe(body.id);
      });
    });

    it('con hitos como objetos ignora los id recibidos y crea hitos nuevos', async () => {
      const idInventado = new Types.ObjectId().toString();

      const { body } = await request(app)
        .post('/api/experiencia')
        .set('x-token', token)
        .send({
          ...experienciaValida,
          hitos: [{ id: idInventado, descripcion: 'Con id previo' }],
        })
        .expect(201);

      expect(body.hitos).toHaveLength(1);
      expect(body.hitos[0].descripcion).toBe('Con id previo');
      expect(body.hitos[0].id).not.toBe(idInventado);
      await expect(Hito.findById(idInventado)).resolves.toBeNull();
    });

    it('descarta las descripciones de hito vacias o de solo espacios', async () => {
      const { body } = await request(app)
        .post('/api/experiencia')
        .set('x-token', token)
        .send({
          ...experienciaValida,
          hitos: ['Valido', '', '   ', { descripcion: '  ' }],
        })
        .expect(201);

      expect(body.hitos).toHaveLength(1);
      expect(body.hitos[0].descripcion).toBe('Valido');
      await expect(Hito.countDocuments()).resolves.toBe(1);
    });

    it('parte la cadena de tecnologias en dos ObjectId y guarda [] con la cadena vacia', async () => {
      const idA = new Types.ObjectId().toString();
      const idB = new Types.ObjectId().toString();

      const conTecnologias = await request(app)
        .post('/api/experiencia')
        .set('x-token', token)
        .send({ ...experienciaValida, tecnologias: `${idA},${idB}` })
        .expect(201);

      expect(conTecnologias.body.tecnologias).toEqual([idA, idB]);

      const sinTecnologias = await request(app)
        .post('/api/experiencia')
        .set('x-token', token)
        .send({ ...experienciaValida, tecnologias: '' })
        .expect(201);

      expect(sinTecnologias.body.tecnologias).toEqual([]);
    });

    it('con fechaFin vacia guarda null', async () => {
      const { body } = await request(app)
        .post('/api/experiencia')
        .set('x-token', token)
        .send({ ...experienciaValida, fechaFin: '' })
        .expect(201);

      expect(body.fechaFin).toBeNull();
      const enBd = await Experiencia.findById(body.id);
      expect(enBd.fechaFin).toBeNull();
    });

    it('sin token devuelve 401', async () => {
      const { body } = await request(app)
        .post('/api/experiencia')
        .send(experienciaValida)
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      await expect(Experiencia.countDocuments()).resolves.toBe(0);
    });
  });

  describe('PUT /api/experiencia/:id', () => {
    it('reconcilia los hitos: conserva el reenviado, crea el nuevo y borra el que ya no viene', async () => {
      const experiencia = await crearExperienciaEnBd();
      const conservado = await crearHitoEnBd(experiencia._id, {
        descripcion: 'Se queda',
      });
      const borrado = await crearHitoEnBd(experiencia._id, {
        descripcion: 'Se va',
      });

      const { body } = await request(app)
        .put(`/api/experiencia/${experiencia._id}`)
        .set('x-token', token)
        .send({
          ...experienciaValida,
          hitos: [
            { id: conservado._id.toString(), descripcion: 'Se queda editado' },
            { descripcion: 'Recien creado' },
          ],
        })
        .expect(200);

      expect(body.hitos).toHaveLength(2);

      const enBd = await Hito.find({ experiencia: experiencia._id });
      expect(enBd).toHaveLength(2);

      const conservadoEnBd = enBd.find(
        (hito) => String(hito._id) === String(conservado._id),
      );
      expect(conservadoEnBd.descripcion).toBe('Se queda editado');

      const creadoEnBd = enBd.find(
        (hito) => String(hito._id) !== String(conservado._id),
      );
      expect(creadoEnBd.descripcion).toBe('Recien creado');

      await expect(Hito.findById(borrado._id)).resolves.toBeNull();
    });

    it('descarta el id de un hito de otra experiencia y crea uno nuevo', async () => {
      const experiencia = await crearExperienciaEnBd();
      const otraExperiencia = await crearExperienciaEnBd({
        empresa: 'Otra empresa',
      });
      const hitoAjeno = await crearHitoEnBd(otraExperiencia._id, {
        descripcion: 'De otra experiencia',
      });

      const { body } = await request(app)
        .put(`/api/experiencia/${experiencia._id}`)
        .set('x-token', token)
        .send({
          ...experienciaValida,
          hitos: [{ id: hitoAjeno._id.toString(), descripcion: 'Reasignado' }],
        })
        .expect(200);

      expect(body.hitos).toHaveLength(1);
      expect(body.hitos[0].id).not.toBe(hitoAjeno._id.toString());
      expect(body.hitos[0].descripcion).toBe('Reasignado');

      const ajenoEnBd = await Hito.findById(hitoAjeno._id);
      expect(ajenoEnBd.descripcion).toBe('De otra experiencia');
      expect(ajenoEnBd.experiencia.toString()).toBe(
        otraExperiencia._id.toString(),
      );
    });
  });

  describe('DELETE /api/experiencia/:id', () => {
    it('borra en cascada sus hitos sin tocar los de otra experiencia, y devuelve 404 con un id inexistente', async () => {
      const experiencia = await crearExperienciaEnBd();
      await crearHitoEnBd(experiencia._id, { descripcion: 'Uno' });
      await crearHitoEnBd(experiencia._id, { descripcion: 'Dos' });

      const otraExperiencia = await crearExperienciaEnBd({
        empresa: 'Otra empresa',
      });
      const hitoAjeno = await crearHitoEnBd(otraExperiencia._id, {
        descripcion: 'Intacto',
      });

      const { body } = await request(app)
        .delete(`/api/experiencia/${experiencia._id}`)
        .set('x-token', token)
        .expect(200);

      expect(body).toMatchObject({
        msg: 'Experiencia eliminada',
        hitosEliminados: 2,
      });
      expect(body.experiencia.id).toBe(experiencia._id.toString());

      await expect(
        Hito.countDocuments({ experiencia: experiencia._id }),
      ).resolves.toBe(0);
      await expect(Hito.findById(hitoAjeno._id)).resolves.not.toBeNull();

      const inexistente = await request(app)
        .delete(`/api/experiencia/${new Types.ObjectId()}`)
        .set('x-token', token)
        .expect(404);

      expect(inexistente.body).toEqual({ msg: 'Experiencia no encontrada' });
    });
  });
});

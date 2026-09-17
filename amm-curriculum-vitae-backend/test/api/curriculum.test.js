/* global describe, it, expect */
const request = require('supertest');

const app = require('../../index');
const {
  crearConocimientoEnBd,
  crearExperienciaEnBd,
  crearFormacionComplementariaEnBd,
  crearFormacionEnBd,
  crearHitoEnBd,
  crearPerfilEnBd,
} = require('../utils/fixtures');

describe('/api/curriculum', () => {
  describe('GET /api/curriculum', () => {
    it('con la base vacia devuelve 200 con las cinco claves vacias', async () => {
      const { body } = await request(app).get('/api/curriculum').expect(200);

      expect(body).toEqual({
        conocimiento: [],
        experiencia: [],
        formaciones: [],
        formacionesComplementarias: [],
        perfil: null,
      });
    });

    it('con datos de los cinco tipos los devuelve agrupados en sus claves', async () => {
      const conocimiento = await crearConocimientoEnBd();
      const experiencia = await crearExperienciaEnBd();
      const formacion = await crearFormacionEnBd();
      const formacionComplementaria = await crearFormacionComplementariaEnBd();
      const perfil = await crearPerfilEnBd();

      const { body } = await request(app).get('/api/curriculum').expect(200);

      expect(body.conocimiento).toHaveLength(1);
      expect(body.conocimiento[0].id).toBe(conocimiento._id.toString());
      expect(body.experiencia).toHaveLength(1);
      expect(body.experiencia[0].id).toBe(experiencia._id.toString());
      expect(body.formaciones).toHaveLength(1);
      expect(body.formaciones[0].id).toBe(formacion._id.toString());
      expect(body.formacionesComplementarias).toHaveLength(1);
      expect(body.formacionesComplementarias[0].id).toBe(
        formacionComplementaria._id.toString(),
      );
      expect(body.perfil.id).toBe(perfil._id.toString());
      expect(body.perfil).not.toHaveProperty('_id');
      expect(body.perfil).not.toHaveProperty('__v');
    });

    it('las experiencias llegan con sus hitos poblados', async () => {
      const experiencia = await crearExperienciaEnBd();
      const hito = await crearHitoEnBd(experiencia._id, {
        descripcion: 'Migracion a React',
      });

      const { body } = await request(app).get('/api/curriculum').expect(200);

      expect(body.experiencia[0].hitos).toHaveLength(1);
      expect(body.experiencia[0].hitos[0]).toMatchObject({
        id: hito._id.toString(),
        descripcion: 'Migracion a React',
      });
    });

    it('es publico: responde 200 sin cabecera x-token', async () => {
      await crearConocimientoEnBd();

      const { body, headers } = await request(app)
        .get('/api/curriculum')
        .expect(200);

      expect(headers).not.toHaveProperty('x-token');
      expect(body.conocimiento).toHaveLength(1);
    });
  });
});

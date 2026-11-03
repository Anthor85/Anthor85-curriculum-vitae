/* global describe, it, expect */
const request = require('supertest');

const app = require('../../index');
const {
  crearConocimientoEnBd,
  crearExperienciaEnBd,
  crearFormacionComplementariaEnBd,
  crearFormacionEnBd,
  crearExtraEnBd,
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
        descripcion: { es: 'Migracion a React', en: 'React migration' },
      });

      const { body } = await request(app).get('/api/curriculum').expect(200);

      expect(body.experiencia[0].hitos).toHaveLength(1);
      expect(body.experiencia[0].hitos[0]).toMatchObject({
        id: hito._id.toString(),
        descripcion: 'Migracion a React',
      });
    });

    it('las formaciones llegan con sus extras poblados', async () => {
      const formacion = await crearFormacionEnBd();
      const extra = await crearExtraEnBd(formacion._id, {
        descripcion: { es: 'Premio extraordinario', en: 'Outstanding award' },
      });

      const { body } = await request(app).get('/api/curriculum').expect(200);

      expect(body.formaciones[0].extras).toHaveLength(1);
      expect(body.formaciones[0].extras[0]).toMatchObject({
        id: extra._id.toString(),
        descripcion: 'Premio extraordinario',
      });
    });

    describe('?lang', () => {
      const sembrarCurriculum = async () => {
        await crearConocimientoEnBd({ prioridad: 'alta' });
        await crearConocimientoEnBd({
          titulo: { es: 'Pruebas unitarias', en: 'Unit testing' },
          prioridad: 'baja',
        });
        const experiencia = await crearExperienciaEnBd();
        await crearHitoEnBd(experiencia._id, {
          descripcion: { es: 'Hito sin traducir', en: '' },
        });
        const formacion = await crearFormacionEnBd();
        await crearExtraEnBd(formacion._id);
        await crearFormacionComplementariaEnBd();
        await crearPerfilEnBd({
          disponibilidad: { es: 'Inmediata', en: 'Immediate' },
          idiomas: [
            {
              idioma: { es: 'Inglés', en: 'English' },
              nivel: { es: 'Avanzado', en: '' },
            },
          ],
        });
      };

      it('con lang=en devuelve en si esta relleno y cae a es si esta vacio', async () => {
        await sembrarCurriculum();

        const { body } = await request(app)
          .get('/api/curriculum?lang=en')
          .expect(200);

        expect(body.experiencia[0].descripcion).toBe(
          'Web application development',
        );
        expect(body.experiencia[0].hitos[0].descripcion).toBe(
          'Hito sin traducir',
        );
        expect(body.formaciones[0]).toMatchObject({
          titulo: 'Computer Engineering',
          institucion: 'Test University',
        });
        expect(body.formaciones[0].extras[0].descripcion).toBe('Test extra');
        expect(body.formacionesComplementarias[0]).toMatchObject({
          titulo: 'React course',
          institucion: 'Test academy',
        });
        expect(body.perfil).toMatchObject({
          nombre: 'Antonio',
          descripcion: 'Full stack developer',
          direccion: '1 Test Street',
          disponibilidad: 'Immediate',
        });
        expect(body.conocimiento[0].prioridad).toBe('alta');
      });

      it('resuelve el titulo de conocimiento con fallback a es', async () => {
        await sembrarCurriculum();

        const en = await request(app).get('/api/curriculum?lang=en');
        const es = await request(app).get('/api/curriculum?lang=es');

        expect(en.body.conocimiento.map(({ titulo }) => titulo)).toEqual([
          'React',
          'Unit testing',
        ]);
        expect(es.body.conocimiento.map(({ titulo }) => titulo)).toEqual([
          'React',
          'Pruebas unitarias',
        ]);
      });

      it('resuelve los idiomas del perfil', async () => {
        await sembrarCurriculum();

        const en = await request(app).get('/api/curriculum?lang=en');
        const es = await request(app).get('/api/curriculum?lang=es');

        expect(en.body.perfil.idiomas).toEqual([
          { idioma: 'English', nivel: 'Avanzado' },
        ]);
        expect(es.body.perfil.idiomas).toEqual([
          { idioma: 'Inglés', nivel: 'Avanzado' },
        ]);
      });

      it.each([
        ['sin lang', '/api/curriculum'],
        ['con lang=es', '/api/curriculum?lang=es'],
        ['con lang=fr', '/api/curriculum?lang=fr'],
      ])('%s devuelve strings en es', async (_caso, url) => {
        await sembrarCurriculum();

        const { body } = await request(app).get(url).expect(200);

        expect(body.experiencia[0].descripcion).toBe(
          'Desarrollo de aplicaciones web',
        );
        expect(body.formaciones[0].titulo).toBe('Ingenieria Informatica');
        expect(body.formacionesComplementarias[0].titulo).toBe(
          'Curso de React',
        );
        expect(body.perfil.descripcion).toBe('Desarrollador full stack');
        expect(body.perfil.disponibilidad).toBe('Inmediata');
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

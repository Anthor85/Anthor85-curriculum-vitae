/* global describe, it, expect, beforeEach */
const { Types } = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Perfil = require('../../models/Perfil');
const { crearPerfilEnBd } = require('../utils/fixtures');
const { tokenValido } = require('../utils/token');

const perfilValido = {
  nombre: 'Antonio',
  apellidos: 'Macian Martinez',
  email: 'nuevo@test.com',
  telefono: '611111111',
  direccion: 'Avenida de test, 2',
  descripcion: 'Desarrollador full stack',
};

const enlaces = {
  linkedinURL: 'https://www.linkedin.com/in/antonio',
  githubURL: 'https://github.com/Anthor85',
};

describe('/api/perfil', () => {
  let token;

  beforeEach(() => {
    token = tokenValido(new Types.ObjectId().toString());
  });

  describe('GET /api/perfil', () => {
    it('sin perfil en la base devuelve 404', async () => {
      const { body } = await request(app).get('/api/perfil').expect(404);

      expect(body).toEqual({ msg: 'Perfil no encontrado' });
    });

    it('con un perfil sembrado lo devuelve con id y sin _id ni __v', async () => {
      const perfil = await crearPerfilEnBd();

      const { body } = await request(app).get('/api/perfil').expect(200);

      expect(body).toEqual({
        id: perfil._id.toString(),
        nombre: 'Antonio',
        apellidos: 'Macian Martinez',
        email: 'test@test.com',
        telefono: '600000000',
        direccion: 'Calle de test, 1',
        descripcion: 'Desarrollador full stack',
        idiomas: [],
      });
      expect(body).not.toHaveProperty('_id');
      expect(body).not.toHaveProperty('__v');
    });

    it('con un perfil sembrado con linkedinURL y githubURL los devuelve', async () => {
      await crearPerfilEnBd(enlaces);

      const { body } = await request(app).get('/api/perfil').expect(200);

      expect(body).toMatchObject(enlaces);
    });

    it('con un perfil sin esos campos no los incluye', async () => {
      await crearPerfilEnBd();

      const { body } = await request(app).get('/api/perfil').expect(200);

      expect(body).not.toHaveProperty('linkedinURL');
      expect(body).not.toHaveProperty('githubURL');
    });
  });

  describe('POST /api/perfil', () => {
    it('con token devuelve 201 y deja el perfil en la base', async () => {
      const { body } = await request(app)
        .post('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, foto: 'https://test.com/foto.png' })
        .expect(201);

      expect(body).toEqual({
        id: expect.any(String),
        ...perfilValido,
        foto: 'https://test.com/foto.png',
        idiomas: [],
      });
      await expect(Perfil.countDocuments()).resolves.toBe(1);
    });

    it('con idiomas los guarda y los devuelve sin _id', async () => {
      const idiomas = [{ idioma: 'Inglés', nivel: 'B2' }];

      const { body } = await request(app)
        .post('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, idiomas })
        .expect(201);

      expect(body.idiomas).toEqual(idiomas);
    });

    it('con un idioma sin nivel devuelve 500 y no crea nada', async () => {
      await request(app)
        .post('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, idiomas: [{ idioma: 'Inglés', nivel: '' }] })
        .expect(500);

      await expect(Perfil.countDocuments()).resolves.toBe(0);
    });

    it('con foto vacia guarda el perfil sin el campo foto', async () => {
      const { body } = await request(app)
        .post('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, foto: '' })
        .expect(201);

      expect(body).not.toHaveProperty('foto');
      const enBd = await Perfil.findById(body.id);
      expect(enBd.foto).toBeUndefined();
    });

    it('con linkedinURL y githubURL validos devuelve 201 y los incluye', async () => {
      const { body } = await request(app)
        .post('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, ...enlaces })
        .expect(201);

      expect(body).toMatchObject(enlaces);
      const enBd = await Perfil.findById(body.id);
      expect(enBd.linkedinURL).toBe(enlaces.linkedinURL);
      expect(enBd.githubURL).toBe(enlaces.githubURL);
    });

    it('con linkedinURL y githubURL vacios guarda el perfil sin los campos', async () => {
      const { body } = await request(app)
        .post('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, linkedinURL: '', githubURL: '' })
        .expect(201);

      expect(body).not.toHaveProperty('linkedinURL');
      expect(body).not.toHaveProperty('githubURL');
      const enBd = await Perfil.findById(body.id);
      expect(enBd.linkedinURL).toBeUndefined();
      expect(enBd.githubURL).toBeUndefined();
    });

    it('con linkedinURL sin protocolo http(s) devuelve 500 y no crea nada', async () => {
      await request(app)
        .post('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, linkedinURL: 'javascript:alert(1)' })
        .expect(500);

      await expect(Perfil.countDocuments()).resolves.toBe(0);
    });

    it('con fechaNacimiento en el body la ignora y no la guarda', async () => {
      const { body } = await request(app)
        .post('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, fechaNacimiento: '1985-05-20' })
        .expect(201);

      expect(body).not.toHaveProperty('fechaNacimiento');
      const enBd = await Perfil.findById(body.id).lean();
      expect(enBd).not.toHaveProperty('fechaNacimiento');
    });

    it('sin token devuelve 401', async () => {
      const { body } = await request(app)
        .post('/api/perfil')
        .send(perfilValido)
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      await expect(Perfil.countDocuments()).resolves.toBe(0);
    });
  });

  describe('PUT /api/perfil', () => {
    it('con token actualiza el unico perfil y devuelve el resultado', async () => {
      const perfil = await crearPerfilEnBd();

      const { body } = await request(app)
        .put('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, nombre: 'Antonio Manuel' })
        .expect(200);

      expect(body).toEqual({
        id: perfil._id.toString(),
        ...perfilValido,
        nombre: 'Antonio Manuel',
        idiomas: [],
      });
      const enBd = await Perfil.findById(perfil._id);
      expect(enBd.nombre).toBe('Antonio Manuel');
      expect(enBd.email).toBe('nuevo@test.com');
    });

    it('sobre un perfil sin linkedinURL ni githubURL los anade', async () => {
      const perfil = await crearPerfilEnBd();

      const { body } = await request(app)
        .put('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, ...enlaces })
        .expect(200);

      expect(body).toMatchObject(enlaces);
      const enBd = await Perfil.findById(perfil._id);
      expect(enBd.linkedinURL).toBe(enlaces.linkedinURL);
      expect(enBd.githubURL).toBe(enlaces.githubURL);
    });

    it('con linkedinURL y githubURL recorta los espacios', async () => {
      await crearPerfilEnBd();

      const { body } = await request(app)
        .put('/api/perfil')
        .set('x-token', token)
        .send({
          ...perfilValido,
          linkedinURL: `  ${enlaces.linkedinURL}  `,
          githubURL: `  ${enlaces.githubURL}  `,
        })
        .expect(200);

      expect(body).toMatchObject(enlaces);
    });

    it('con linkedinURL y githubURL vacios los elimina', async () => {
      const perfil = await crearPerfilEnBd(enlaces);

      const { body } = await request(app)
        .put('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, linkedinURL: '', githubURL: '' })
        .expect(200);

      expect(body).not.toHaveProperty('linkedinURL');
      expect(body).not.toHaveProperty('githubURL');
      const enBd = await Perfil.findById(perfil._id).lean();
      expect(enBd).not.toHaveProperty('linkedinURL');
      expect(enBd).not.toHaveProperty('githubURL');
    });

    it('con githubURL sin protocolo devuelve 500 y conserva el valor anterior', async () => {
      const perfil = await crearPerfilEnBd(enlaces);

      await request(app)
        .put('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, ...enlaces, githubURL: 'github.com/Anthor85' })
        .expect(500);

      const enBd = await Perfil.findById(perfil._id);
      expect(enBd.githubURL).toBe(enlaces.githubURL);
      expect(enBd.nombre).toBe('Antonio');
    });

    it('un perfil guardado sin los campos nuevos se sigue actualizando', async () => {
      const perfil = await crearPerfilEnBd();

      const { body } = await request(app)
        .put('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, nombre: 'Antonio Manuel' })
        .expect(200);

      expect(body.nombre).toBe('Antonio Manuel');
      expect(body).not.toHaveProperty('linkedinURL');
      const enBd = await Perfil.findById(perfil._id);
      expect(enBd.nombre).toBe('Antonio Manuel');
    });

    it('con fechaNacimiento en el body la ignora y no la guarda', async () => {
      const perfil = await crearPerfilEnBd();

      const { body } = await request(app)
        .put('/api/perfil')
        .set('x-token', token)
        .send({ ...perfilValido, fechaNacimiento: '1985-05-20' })
        .expect(200);

      expect(body).not.toHaveProperty('fechaNacimiento');
      const enBd = await Perfil.findById(perfil._id).lean();
      expect(enBd).not.toHaveProperty('fechaNacimiento');
    });

    it('sin perfil en la base devuelve 404', async () => {
      const { body } = await request(app)
        .put('/api/perfil')
        .set('x-token', token)
        .send(perfilValido)
        .expect(404);

      expect(body).toEqual({ msg: 'Perfil no encontrado' });
    });

    it('sin token devuelve 401 y el perfil no cambia', async () => {
      const perfil = await crearPerfilEnBd();

      const { body } = await request(app)
        .put('/api/perfil')
        .send({ ...perfilValido, nombre: 'Antonio Manuel' })
        .expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
      const enBd = await Perfil.findById(perfil._id);
      expect(enBd.nombre).toBe('Antonio');
      expect(enBd.email).toBe('test@test.com');
    });
  });
});

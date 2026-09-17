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
  fechaNacimiento: '1985-05-20',
  descripcion: 'Desarrollador full stack',
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
        fechaNacimiento: '1985-05-20T00:00:00.000Z',
        descripcion: 'Desarrollador full stack',
      });
      expect(body).not.toHaveProperty('_id');
      expect(body).not.toHaveProperty('__v');
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
        fechaNacimiento: '1985-05-20T00:00:00.000Z',
        foto: 'https://test.com/foto.png',
      });
      await expect(Perfil.countDocuments()).resolves.toBe(1);
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
        fechaNacimiento: '1985-05-20T00:00:00.000Z',
      });
      const enBd = await Perfil.findById(perfil._id);
      expect(enBd.nombre).toBe('Antonio Manuel');
      expect(enBd.email).toBe('nuevo@test.com');
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

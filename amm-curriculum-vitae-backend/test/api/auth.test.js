/* global describe, it, expect */
const jwt = require('jsonwebtoken');
const request = require('supertest');

const app = require('../../index');
const { crearUsuarioEnBd } = require('../utils/fixtures');
const { tokenDeOtraSemilla, tokenValido } = require('../utils/token');

describe('/api/auth', () => {
  describe('POST /api/auth', () => {
    it('con email y contraseña correctos devuelve 200 con uid, nombre, email y un token verificable', async () => {
      const usuario = await crearUsuarioEnBd();

      const { body } = await request(app)
        .post('/api/auth')
        .send({ email: 'test@test.com', password: '123456' })
        .expect(200);

      expect(body).toEqual({
        uid: usuario._id.toString(),
        nombre: 'Antonio',
        email: 'test@test.com',
        token: expect.any(String),
      });

      const payload = jwt.verify(body.token, process.env.SECRET_JWT_SEED);
      expect(payload.uid).toBe(usuario._id.toString());
      expect(payload.nombre).toBe('Antonio');
    });

    it('con un email inexistente devuelve 400 y Credenciales incorrectas', async () => {
      await crearUsuarioEnBd();

      const { body } = await request(app)
        .post('/api/auth')
        .send({ email: 'otro@test.com', password: '123456' })
        .expect(400);

      expect(body).toEqual({ msg: 'Credenciales incorrectas' });
    });

    it('con la contraseña incorrecta devuelve 400 y el mismo mensaje', async () => {
      await crearUsuarioEnBd();

      const { body } = await request(app)
        .post('/api/auth')
        .send({ email: 'test@test.com', password: 'incorrecta' })
        .expect(400);

      expect(body).toEqual({ msg: 'Credenciales incorrectas' });
    });

    it('sin body devuelve 400 y Credenciales incorrectas', async () => {
      const { body } = await request(app).post('/api/auth').expect(400);

      expect(body).toEqual({ msg: 'Credenciales incorrectas' });
    });

    it('la respuesta del login no incluye password, _id ni __v', async () => {
      await crearUsuarioEnBd();

      const { body } = await request(app)
        .post('/api/auth')
        .send({ email: 'test@test.com', password: '123456' })
        .expect(200);

      expect(Object.keys(body).sort()).toEqual([
        'email',
        'nombre',
        'token',
        'uid',
      ]);
      expect(body).not.toHaveProperty('password');
      expect(body).not.toHaveProperty('_id');
      expect(body).not.toHaveProperty('__v');
    });
  });

  describe('GET /api/auth/renew', () => {
    it('con un token válido devuelve 200, los mismos datos y un token nuevo', async () => {
      const usuario = await crearUsuarioEnBd();

      const { body } = await request(app)
        .get('/api/auth/renew')
        .set('x-token', tokenValido(usuario._id.toString()))
        .expect(200);

      expect(body).toEqual({
        uid: usuario._id.toString(),
        nombre: 'Antonio',
        email: 'test@test.com',
        token: expect.any(String),
      });

      const payload = jwt.verify(body.token, process.env.SECRET_JWT_SEED);
      expect(payload.uid).toBe(usuario._id.toString());
    });

    it('sin cabecera x-token devuelve 401', async () => {
      const { body } = await request(app).get('/api/auth/renew').expect(401);

      expect(body).toEqual({ msg: 'No hay token en la petición' });
    });

    it('con un token firmado con otra semilla devuelve 401', async () => {
      const usuario = await crearUsuarioEnBd();

      const { body } = await request(app)
        .get('/api/auth/renew')
        .set('x-token', tokenDeOtraSemilla(usuario._id.toString()))
        .expect(401);

      expect(body).toEqual({ msg: 'Token no válido' });
    });
  });
});

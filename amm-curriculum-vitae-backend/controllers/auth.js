const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { generarJWT } = require('../helpers/jwt');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');

const login = async (req, res) => {
  const { email, password } = req.body;

  const usuario = await Usuario.findOne({ email });
  if (!usuario) {
    throw new HttpError(400, 'Credenciales incorrectas');
  }

  const passwordValida = await bcrypt.compare(password, usuario.password);
  if (!passwordValida) {
    throw new HttpError(400, 'Credenciales incorrectas');
  }

  const token = generarJWT(usuario.id, usuario.nombre);

  res.json({
    uid: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    token,
  });
};

const revalidarToken = async (req, res) => {
  const usuario = await Usuario.findById(req.uid);
  if (!usuario) {
    throw new HttpError(401, 'Token no válido');
  }

  const token = generarJWT(usuario.id, usuario.nombre);

  res.json({
    uid: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    token,
  });
};

module.exports = {
  login: conContexto('Error al iniciar sesión', login),
  revalidarToken: conContexto('Error al renovar el token', revalidarToken),
};

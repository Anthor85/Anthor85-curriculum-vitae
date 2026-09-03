const { response } = require('express');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { generarJWT } = require('../helpers/jwt');

const login = async (req, res = response) => {
  const { email, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ msg: 'Credenciales incorrectas' });
    }

    const passwordValida = bcrypt.compareSync(password, usuario.password);
    if (!passwordValida) {
      return res.status(400).json({ msg: 'Credenciales incorrectas' });
    }

    const token = await generarJWT(usuario.id, usuario.nombre);

    res.json({
      uid: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al iniciar sesión' });
  }
};

const revalidarToken = async (req, res = response) => {
  try {
    const usuario = await Usuario.findById(req.uid);
    if (!usuario) {
      return res.status(401).json({ msg: 'Token no válido' });
    }

    const token = await generarJWT(usuario.id, usuario.nombre);

    res.json({
      uid: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al renovar el token' });
  }
};

module.exports = {
  login,
  revalidarToken,
};

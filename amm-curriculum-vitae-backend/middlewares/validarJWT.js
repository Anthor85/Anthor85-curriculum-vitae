const { response } = require('express');
const jwt = require('jsonwebtoken');

const validarJWT = (req, res = response, next) => {
  const token = req.header('x-token');

  if (!token) {
    return res.status(401).json({ msg: 'No hay token en la petición' });
  }

  try {
    const { uid, nombre } = jwt.verify(token, process.env.SECRET_JWT_SEED);

    req.uid = uid;
    req.nombre = nombre;
  } catch (error) {
    console.error(error);
    return res.status(401).json({ msg: 'Token no válido' });
  }

  next();
};

module.exports = { validarJWT };

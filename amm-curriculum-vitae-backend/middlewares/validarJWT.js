const jwt = require('jsonwebtoken');
const { HttpError } = require('../helpers/HttpError');

const validarJWT = (req, _res, next) => {
  const token = req.header('x-token');

  if (!token) {
    throw new HttpError(401, 'No hay token en la petición');
  }

  try {
    const { uid, nombre } = jwt.verify(token, process.env.SECRET_JWT_SEED);

    req.uid = uid;
    req.nombre = nombre;
  } catch (error) {
    console.error(error);
    throw new HttpError(401, 'Token no válido');
  }

  next();
};

module.exports = { validarJWT };

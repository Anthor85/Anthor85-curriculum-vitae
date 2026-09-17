const jwt = require('jsonwebtoken');

const generarJWT = (uid, nombre) => {
  const payload = { uid, nombre };

  try {
    return jwt.sign(payload, process.env.SECRET_JWT_SEED, {
      expiresIn: '30d',
    });
  } catch (error) {
    console.error(error);
    throw new Error('No se pudo generar el token');
  }
};

module.exports = { generarJWT };

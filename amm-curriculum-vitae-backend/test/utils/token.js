const jwt = require('jsonwebtoken');

const { generarJWT } = require('../../helpers/jwt');

// Token real, firmado por el mismo helper que usa el login. Asi el middleware
// validarJWT se ejercita de verdad en lugar de mockearse.
const tokenValido = (uid, nombre = 'Antonio') => generarJWT(uid, nombre);

// Token bien firmado pero ya expirado: validarJWT debe rechazarlo.
const tokenCaducado = (uid, nombre = 'Antonio') =>
  jwt.sign({ uid, nombre }, process.env.SECRET_JWT_SEED, { expiresIn: '-1s' });

// Token con la estructura correcta pero firmado con otra semilla.
const tokenDeOtraSemilla = (uid, nombre = 'Antonio') =>
  jwt.sign({ uid, nombre }, 'otra-semilla-distinta', { expiresIn: '30d' });

module.exports = {
  tokenValido,
  tokenCaducado,
  tokenDeOtraSemilla,
};

const jwt = require('jsonwebtoken');

const generarJWT = (uid, nombre) => {
  return new Promise((resolve, reject) => {
    const payload = { uid, nombre };

    jwt.sign(
      payload,
      process.env.SECRET_JWT_SEED,
      {
        expiresIn: '30d',
      },
      (err, token) => {
        if (err) {
          console.error(err);
          reject('No se pudo generar el token');
        }

        resolve(token);
      },
    );
  });
};

module.exports = { generarJWT };

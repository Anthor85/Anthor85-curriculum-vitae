const mongoose = require('mongoose');
require('dotenv').config();

// En serverless (Vercel) cada invocacion puede reutilizar el modulo o crear un
// contexto nuevo: cacheamos la promesa en global para no abrir una conexion por
// peticion y agotar el pool de Atlas.
const cached =
  global._mongooseConn ||
  (global._mongooseConn = {
    conn: null,
    promise: null,
  });

const dbConnection = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.DB_CONN)
      .then((mongooseInstance) => {
        console.log('Base de datos online');
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.log(error);
        throw new Error('Error al inicializar BD');
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = {
  dbConnection,
};

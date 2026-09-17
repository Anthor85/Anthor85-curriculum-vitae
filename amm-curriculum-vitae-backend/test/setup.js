/* global beforeAll, afterEach, afterAll */
const mongoose = require('mongoose');

// Semilla fija para que los tokens de los tests sean deterministas.
process.env.SECRET_JWT_SEED = 'semilla-de-test';

// Una base de datos por worker sobre el mismo servidor en memoria: asi los
// archivos pueden correr en paralelo sin que el afterEach de uno vacie las
// colecciones de otro.
const worker = process.env.VITEST_WORKER_ID || '1';
process.env.DB_CONN = `${process.env.MONGO_TEST_URI}vitest_${worker}`;

const { dbConnection } = require('../database/config');

beforeAll(async () => {
  // El dbConnection real, no un mock: deja la promesa cacheada en
  // global._mongooseConn apuntando a la base efimera, de forma que el
  // middleware de index.js no abra una segunda conexion.
  await dbConnection();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  global._mongooseConn = undefined;
});

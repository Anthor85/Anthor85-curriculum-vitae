const { MongoMemoryServer } = require('mongodb-memory-server');

// Un unico servidor de MongoDB en memoria para toda la ejecucion: los workers
// se reparten bases de datos distintas dentro de esta misma instancia.
// Vitest exige que el globalSetup exporte una funcion; el teardown es la
// funcion que esta devuelve.
module.exports = async function setup() {
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_TEST_URI = mongoServer.getUri();

  return async function teardown() {
    await mongoServer.stop();
  };
};

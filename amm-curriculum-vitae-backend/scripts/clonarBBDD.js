const mongoose = require('mongoose');

// Lista explicita y ordenada: los modelos referenciados van antes que los
// que los referencian. Usuario NO se copia a proposito.
const MODELOS = [
  'Conocimiento',
  'Perfil',
  'Formacion',
  'FormacionComplementaria',
  'Experiencia',
  'Hito',
];

const USO = `
Uso:
  npm run clone-db -- --origen="<uri>" --destino="<uri>" [--force]

  --origen   URI de la base desde la que se copian los datos
  --destino  URI de la base a la que se copian los datos
  --force    Vacia las colecciones del destino antes de copiar
`;

const parsearArgumentos = (argv) => {
  const argumentos = { origen: null, destino: null, force: false };

  for (const arg of argv) {
    if (arg === '--force') {
      argumentos.force = true;
    } else if (arg.startsWith('--origen=')) {
      argumentos.origen = arg.slice('--origen='.length);
    } else if (arg.startsWith('--destino=')) {
      argumentos.destino = arg.slice('--destino='.length);
    }
  }

  return argumentos;
};

// Los modelos de models/ estan compilados sobre la conexion por defecto, asi
// que aqui se recompila su schema sobre cada una de las dos conexiones.
const compilarModelos = (conexion) =>
  MODELOS.map((nombre) => ({
    nombre,
    modelo: conexion.model(nombre, require(`../models/${nombre}`).schema),
  }));

const contarDestino = async (modelosDestino) => {
  const recuentos = [];

  for (const { nombre, modelo } of modelosDestino) {
    recuentos.push({ nombre, total: await modelo.countDocuments() });
  }

  return recuentos;
};

const vaciarDestino = async (modelosDestino) => {
  console.log('\nVaciando las colecciones del destino (--force):');

  for (const { nombre, modelo } of modelosDestino) {
    const { deletedCount } = await modelo.deleteMany({});
    console.log(`  ${nombre.padEnd(24)} -${deletedCount}`);
  }
};

// lean() devuelve el documento crudo, con su _id y su __v, sin pasar por el
// toJSON del modelo: las referencias entre colecciones siguen siendo validas.
// Devuelve los nombres de las colecciones cuyo recuento no cuadra.
const copiar = async (modelosOrigen, modelosDestino) => {
  const descuadres = [];
  console.log('');

  for (let i = 0; i < MODELOS.length; i++) {
    const { nombre, modelo: modeloOrigen } = modelosOrigen[i];
    const { modelo: modeloDestino } = modelosDestino[i];

    const documentos = await modeloOrigen.find().lean();

    if (documentos.length > 0) {
      await modeloDestino.insertMany(documentos, { ordered: false });
    }

    const total = await modeloDestino.countDocuments();
    console.log(
      `${nombre.padEnd(24)} ${String(documentos.length).padStart(4)} -> ${total}`,
    );

    if (total !== documentos.length) {
      descuadres.push(nombre);
    }
  }

  return descuadres;
};

const clonarBBDD = async () => {
  const { origen, destino, force } = parsearArgumentos(process.argv.slice(2));

  if (!origen || !destino) {
    console.error('Faltan --origen o --destino');
    console.error(USO);
    process.exitCode = 1;
    return;
  }

  if (origen === destino) {
    console.error('Origen y destino son la misma conexion');
    process.exitCode = 1;
    return;
  }

  let conexionOrigen = null;
  let conexionDestino = null;

  try {
    conexionOrigen = await mongoose.createConnection(origen).asPromise();
    conexionDestino = await mongoose.createConnection(destino).asPromise();

    console.log(`Origen:  ${conexionOrigen.name}`);
    console.log(`Destino: ${conexionDestino.name}`);

    const modelosOrigen = compilarModelos(conexionOrigen);
    const modelosDestino = compilarModelos(conexionDestino);

    const noVacias = (await contarDestino(modelosDestino)).filter(
      ({ total }) => total > 0,
    );

    if (noVacias.length > 0 && !force) {
      console.error('\nEl destino ya tiene documentos en:');
      for (const { nombre, total } of noVacias) {
        console.error(`  ${nombre.padEnd(24)} ${total}`);
      }
      console.error('\nNo se ha escrito nada. Usa --force para vaciarlas.');
      process.exitCode = 1;
      return;
    }

    if (noVacias.length > 0) {
      await vaciarDestino(modelosDestino);
    }

    const descuadres = await copiar(modelosOrigen, modelosDestino);

    if (descuadres.length > 0) {
      // insertMany con ordered:false descarta en silencio los documentos que
      // no validan contra el schema, asi que el recuento es la unica senal
      // de que algo se ha quedado por el camino.
      console.error(
        `\nEl recuento no cuadra en: ${descuadres.join(', ')}. ` +
          'Revisa el destino antes de darlo por bueno.',
      );
      process.exitCode = 1;
      return;
    }

    console.log(
      '\nClonado completado. La coleccion usuarios NO se ha copiado: ' +
        'ejecuta `npm run seed` contra el destino.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (conexionOrigen) await conexionOrigen.close();
    if (conexionDestino) await conexionDestino.close();
  }
};

clonarBBDD();

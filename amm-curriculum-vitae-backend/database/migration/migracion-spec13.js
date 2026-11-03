// SPEC 13 — Migración a contenido bilingüe { es, en } y prioridades por clave.
// Incluye la enmienda 2026-11-03 (Conocimiento.titulo).
// Usa el .env (DB_CONN) y los node_modules del backend, desde cualquier carpeta:
//   node migracion-spec13.js
// Hacer antes la copia: node backup-crudo.js <sufijo>
// Idempotente: se puede ejecutar más de una vez sin cambiar el resultado.
const path = require('path');
const backend = path.join(__dirname, 'amm-curriculum-vitae-backend');
require(path.join(backend, 'node_modules/dotenv')).config({
  path: path.join(backend, '.env'),
  quiet: true,
});
const mongoose = require(path.join(backend, 'node_modules/mongoose'));

const colecciones = [
  'experiencias',
  'hitos',
  'extras',
  'formacions',
  'formacioncomplementarias',
  'perfils',
  'conocimientos',
];
const claves = ['muyAlta', 'alta', 'media', 'baja', 'muyBaja'];

const loc = (campo) => ({ es: { $ifNull: [`$${campo}`, ''] }, en: '' });

const huellaIds = async (db, c) =>
  (await db.collection(c).find({}, { projection: { _id: 1 } }).toArray())
    .map((d) => String(d._id))
    .sort()
    .join();

(async () => {
  const conexion = await mongoose
    .createConnection(process.env.DB_CONN)
    .asPromise();
  const db = conexion.db;
  const col = (c) => db.collection(c);

  console.log(`Base: ${db.databaseName}`);

  // 1. Comprobar que las colecciones existen con los nombres esperados.
  const existentes = (await db.listCollections().toArray()).map((c) => c.name);
  const faltan = colecciones.filter((c) => !existentes.includes(c));
  if (faltan.length > 0) {
    console.error(`ABORTADO: no existen las colecciones ${faltan.join(', ')}`);
    console.error(`Colecciones de la base: ${existentes.join(', ')}`);
    process.exitCode = 1;
    return conexion.close();
  }

  // Huella de los _id antes de migrar, para comprobar que no cambian.
  const idsAntes = {};
  for (const c of colecciones) idsAntes[c] = await huellaIds(db, c);

  // 2. Migración.
  const resultado = (nombre, r) =>
    console.log(
      `${nombre}: ${r.matchedCount} encontrados, ${r.modifiedCount} migrados`,
    );

  resultado(
    'experiencias',
    await col('experiencias').updateMany(
      { 'descripcion.es': { $exists: false } },
      [{ $set: { descripcion: loc('descripcion') } }],
    ),
  );
  resultado(
    'hitos',
    await col('hitos').updateMany({ 'descripcion.es': { $exists: false } }, [
      { $set: { descripcion: loc('descripcion') } },
    ]),
  );
  resultado(
    'extras',
    await col('extras').updateMany({ 'descripcion.es': { $exists: false } }, [
      { $set: { descripcion: loc('descripcion') } },
    ]),
  );
  resultado(
    'formacions',
    await col('formacions').updateMany({ 'titulo.es': { $exists: false } }, [
      { $set: { titulo: loc('titulo'), institucion: loc('institucion') } },
    ]),
  );
  resultado(
    'formacioncomplementarias',
    await col('formacioncomplementarias').updateMany(
      { 'titulo.es': { $exists: false } },
      [{ $set: { titulo: loc('titulo'), institucion: loc('institucion') } }],
    ),
  );
  resultado(
    'perfils',
    await col('perfils').updateMany({ 'descripcion.es': { $exists: false } }, [
      {
        $set: {
          descripcion: loc('descripcion'),
          direccion: loc('direccion'),
          disponibilidad: loc('disponibilidad'),
          idiomas: {
            $map: {
              input: { $ifNull: ['$idiomas', []] },
              in: {
                idioma: { es: '$$this.idioma', en: '' },
                nivel: { es: '$$this.nivel', en: '' },
              },
            },
          },
        },
      },
    ]),
  );
  // Enmienda 2026-11-03: Conocimiento.titulo pasa a { es, en }.
  resultado(
    'conocimientos (titulo)',
    await col('conocimientos').updateMany(
      { 'titulo.es': { $exists: false } },
      [{ $set: { titulo: loc('titulo') } }],
    ),
  );
  // Filtro añadido respecto a la spec ({}): sin él, una segunda ejecución
  // convertiría 'muyAlta', 'alta', 'baja' y 'muyBaja' en 'media' por el default.
  resultado(
    'conocimientos (prioridad)',
    await col('conocimientos').updateMany({ prioridad: { $nin: claves } }, [
      {
        $set: {
          prioridad: {
            $switch: {
              branches: [
                { case: { $eq: ['$prioridad', 'Muy alta'] }, then: 'muyAlta' },
                { case: { $eq: ['$prioridad', 'Alta'] }, then: 'alta' },
                { case: { $eq: ['$prioridad', 'Baja'] }, then: 'baja' },
                { case: { $eq: ['$prioridad', 'Muy baja'] }, then: 'muyBaja' },
              ],
              default: 'media',
            },
          },
        },
      },
    ]),
  );

  // 3. Verificación: todo debe dar 0 y los _id no deben cambiar.
  console.log('\nVerificación (todo debe dar 0):');
  const esString = { $type: 'string' };
  const verificaciones = {
    experiencias: await col('experiencias').countDocuments({ descripcion: esString }),
    hitos: await col('hitos').countDocuments({ descripcion: esString }),
    extras: await col('extras').countDocuments({ descripcion: esString }),
    formacions: await col('formacions').countDocuments({ titulo: esString }),
    formacioncomplementarias: await col('formacioncomplementarias').countDocuments({
      titulo: esString,
    }),
    perfils: await col('perfils').countDocuments({ descripcion: esString }),
    'conocimientos (titulo)': await col('conocimientos').countDocuments({
      titulo: esString,
    }),
    'conocimientos (prioridad)': await col('conocimientos').countDocuments({
      prioridad: { $nin: claves },
    }),
  };
  Object.entries(verificaciones).forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  const idsCambiados = [];
  for (const c of colecciones) {
    if ((await huellaIds(db, c)) !== idsAntes[c]) idsCambiados.push(c);
  }
  console.log(
    idsCambiados.length === 0
      ? '  _id: sin cambios'
      : `  _id CAMBIADOS en: ${idsCambiados.join(', ')}`,
  );

  const ok =
    Object.values(verificaciones).every((n) => n === 0) &&
    idsCambiados.length === 0;
  console.log(ok ? '\nOK: migración correcta' : '\nERROR: revisar la migración');
  if (!ok) process.exitCode = 1;
  await conexion.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

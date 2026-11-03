// Copia en crudo (sin schemas) de todas las colecciones de la base de DB_CONN
// a <base>_backup_spec13[_<sufijo>] en el mismo cluster. Aborta si el destino no
// está vacío. Desde amm-curriculum-vitae-backend (DB_CONN del .env o del entorno):
//   node database/migration/backup-crudo.js [sufijo]
const path = require('path');
// DB_CONN del entorno manda sobre el .env (dotenv no sobrescribe).
require('dotenv').config({
  path: path.join(__dirname, '../../.env'),
  quiet: true,
});
const mongoose = require('mongoose');

(async () => {
  const conexion = await mongoose
    .createConnection(process.env.DB_CONN)
    .asPromise();
  const origen = conexion.db;
  const sufijo = process.argv[2] ? `_${process.argv[2]}` : '';
  const nombreDestino = `${origen.databaseName}_backup_spec13${sufijo}`;
  const destino = conexion.client.db(nombreDestino);

  console.log(`Origen:  ${origen.databaseName}`);
  console.log(`Destino: ${nombreDestino}`);

  const yaHay = await destino.listCollections().toArray();
  if (yaHay.length > 0) {
    console.error(
      `ABORTADO: ${nombreDestino} ya tiene colecciones: ${yaHay.map((c) => c.name).join(', ')}`,
    );
    process.exitCode = 1;
    return conexion.close();
  }

  const colecciones = (
    await origen.listCollections({ type: 'collection' }).toArray()
  )
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort();

  let ok = true;
  for (const nombre of colecciones) {
    const docs = await origen.collection(nombre).find().toArray();
    if (docs.length > 0) await destino.collection(nombre).insertMany(docs);
    const total = await destino.collection(nombre).countDocuments();
    const cuadra = total === docs.length;
    ok &&= cuadra;
    console.log(
      `  ${nombre.padEnd(26)} ${String(docs.length).padStart(4)} -> ${String(total).padStart(4)} ${cuadra ? 'OK' : 'DESCUADRE'}`,
    );
  }

  console.log(ok ? '\nCopia completada' : '\nERROR: algún recuento no cuadra');
  if (!ok) process.exitCode = 1;
  await conexion.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

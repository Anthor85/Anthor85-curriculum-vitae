const express = require('express');
const cors = require('cors');
const { dbConnection } = require('./database/config');
const { manejarErrores } = require('./middlewares/manejarErrores');

//Crear el servidor de express
const app = express();

//CORS
app.use(cors());

//Lectura y parseo del body
app.use(express.json());

//Asegurar la conexión a la base de datos antes de atender la petición: la
//promesa está cacheada, así que solo conecta la primera vez de cada instancia.
app.use(async (req, res, next) => {
  await dbConnection();
  next();
});

//Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/curriculum', require('./routes/curriculum'));
app.use('/api/conocimiento', require('./routes/conocimiento'));
app.use('/api/experiencia', require('./routes/experiencia'));
app.use('/api/formacion', require('./routes/formacion'));
app.use(
  '/api/formacionComplementaria',
  require('./routes/formacionComplementaria'),
);
app.use('/api/perfil', require('./routes/perfil'));

//Manejo centralizado de errores: debe ir después de las rutas
app.use(manejarErrores);

//Escuchar peticiones solo en local; en Vercel se exporta la app
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
  });
}

module.exports = app;

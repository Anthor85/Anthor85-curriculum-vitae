const { HttpError } = require('../helpers/HttpError');

// Middleware de error final: Express 5 reenvía aquí cualquier rechazo de un
// handler async, así que los controladores no necesitan try/catch.
// Solo se expone el mensaje de los HttpError; del resto se registra el detalle
// y se responde con el contexto que puso conContexto, nunca el error interno.
// Los 4 parámetros son obligatorios: Express reconoce los manejadores de error
// por fn.length === 4, y un valor por defecto en cualquiera de ellos rompe ese
// recuento y deja el middleware sin invocar.
// eslint-disable-next-line no-unused-vars
const manejarErrores = (error, req, res, next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ msg: error.message });
  }

  console.error(error);
  res.status(500).json({ msg: error.contexto ?? 'Error interno del servidor' });
};

module.exports = { manejarErrores };

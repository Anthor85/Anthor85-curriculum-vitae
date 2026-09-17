// Envuelve un controlador para etiquetar los errores inesperados con el mensaje
// que verá el cliente ("Error al crear la formación"). Los HttpError ya llevan
// el suyo, así que la etiqueta solo la usa manejarErrores para los 500.
const conContexto = (msg, handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    error.contexto = msg;
    throw error;
  }
};

module.exports = { conContexto };

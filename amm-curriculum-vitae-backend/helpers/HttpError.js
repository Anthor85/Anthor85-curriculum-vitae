// Error con código HTTP y mensaje pensado para el cliente. Lo que se lanza
// desde los controladores lo recoge el middleware manejarErrores.
class HttpError extends Error {
  constructor(status, msg) {
    super(msg);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = { HttpError };

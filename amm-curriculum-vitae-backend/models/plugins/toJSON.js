const { Types } = require('mongoose');

// Deja el objeto plano listo para el cliente: fuera __v y _id, dentro id.
// Se aplica también a los subdocumentos poblados (p. ej. los hitos de una experiencia).
const normalizar = (valor) => {
  if (Array.isArray(valor)) return valor.map(normalizar);

  const esObjetoPlano =
    valor !== null &&
    typeof valor === 'object' &&
    !(valor instanceof Date) &&
    !(valor instanceof Types.ObjectId) &&
    !Buffer.isBuffer(valor);

  if (!esObjetoPlano) return valor;

  const { __v, _id, ...resto } = valor;
  const objeto = Object.fromEntries(
    Object.entries(resto).map(([clave, v]) => [clave, normalizar(v)]),
  );
  if (_id !== undefined) objeto.id = _id;
  return objeto;
};

/**
 * Plugin de Mongoose que unifica el `toJSON` de todos los modelos.
 * @param {import('mongoose').Schema} schema
 * @param {{ omitir?: string[], virtuals?: boolean }} [opciones]
 */
const toJSONPlugin = (schema, { omitir = [], virtuals = false } = {}) => {
  schema.method('toJSON', function () {
    const objeto = normalizar(this.toObject({ virtuals }));
    omitir.forEach((campo) => delete objeto[campo]);
    return objeto;
  });
};

module.exports = toJSONPlugin;

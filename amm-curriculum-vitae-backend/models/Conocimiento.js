const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');
const { localizado } = require('./plugins/localizado');

const ConocimientoSchema = Schema({
  titulo: localizado({ required: true }),
  prioridad: {
    type: String,
    required: true,
    enum: ['muyAlta', 'alta', 'media', 'baja', 'muyBaja'],
    default: 'media',
  },
});

ConocimientoSchema.plugin(toJSON);

module.exports = model('Conocimiento', ConocimientoSchema);

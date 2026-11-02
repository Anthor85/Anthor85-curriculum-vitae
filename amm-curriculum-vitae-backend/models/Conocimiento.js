const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');

const ConocimientoSchema = Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  prioridad: {
    type: String,
    required: true,
    enum: ['muyAlta', 'alta', 'media', 'baja', 'muyBaja'],
    default: 'media',
  },
});

ConocimientoSchema.plugin(toJSON);

module.exports = model('Conocimiento', ConocimientoSchema);

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
    enum: ['Muy alta', 'Alta', 'Media', 'Baja', 'Muy baja'],
    default: 'Media',
  },
});

ConocimientoSchema.plugin(toJSON);

module.exports = model('Conocimiento', ConocimientoSchema);

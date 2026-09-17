const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');

const ConocimientoSchema = Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  nivel: {
    type: String,
    required: true,
    enum: ['Básico', 'Intermedio', 'Avanzado'],
  },
});

ConocimientoSchema.plugin(toJSON);

module.exports = model('Conocimiento', ConocimientoSchema);

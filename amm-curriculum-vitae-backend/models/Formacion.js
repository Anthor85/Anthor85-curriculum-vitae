const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');
const FormacionSchema = Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  institucion: {
    type: String,
    required: true,
    trim: true,
  },
  fechaFin: {
    type: Date,
    required: true,
  },
  descripcion: {
    type: String,
    trim: true,
  },
});

FormacionSchema.plugin(toJSON);

module.exports = model('Formacion', FormacionSchema);

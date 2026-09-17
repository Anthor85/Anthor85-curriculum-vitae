const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');

const PerfilSchema = Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  apellidos: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
  },
  direccion: {
    type: String,
    required: true,
    trim: true,
  },
  fechaNacimiento: {
    type: Date,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
  foto: {
    type: String,
    trim: true,
  },
});

PerfilSchema.plugin(toJSON);

module.exports = model('Perfil', PerfilSchema);

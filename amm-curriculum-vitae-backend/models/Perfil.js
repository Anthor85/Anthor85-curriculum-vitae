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
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
  foto: {
    type: String,
    trim: true,
  },
  linkedinURL: {
    type: String,
    trim: true,
    match: /^https?:\/\//i,
  },
  githubURL: {
    type: String,
    trim: true,
    match: /^https?:\/\//i,
  },
  disponibilidad: {
    type: String,
    trim: true,
  },
  idiomas: {
    type: [
      new Schema(
        {
          idioma: { type: String, required: true, trim: true },
          nivel: { type: String, required: true, trim: true },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
});

PerfilSchema.plugin(toJSON);

module.exports = model('Perfil', PerfilSchema);

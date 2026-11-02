const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');
const { localizado } = require('./plugins/localizado');

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
  direccion: localizado({ required: true }),
  descripcion: localizado({ required: true }),
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
  disponibilidad: localizado(),
  idiomas: {
    type: [
      new Schema(
        {
          idioma: localizado({ required: true }),
          nivel: localizado({ required: true }),
        },
        { _id: false },
      ),
    ],
    default: [],
  },
});

PerfilSchema.plugin(toJSON);

module.exports = model('Perfil', PerfilSchema);

const { Schema, model } = require('mongoose');

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

PerfilSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Perfil', PerfilSchema);

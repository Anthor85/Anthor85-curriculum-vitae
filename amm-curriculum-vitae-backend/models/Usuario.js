const { Schema, model } = require('mongoose');

const UsuarioSchema = Schema({
  nombre: {
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
  password: {
    type: String,
    required: true,
  },
});

UsuarioSchema.method('toJSON', function () {
  const { __v, _id, password: _password, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Usuario', UsuarioSchema);

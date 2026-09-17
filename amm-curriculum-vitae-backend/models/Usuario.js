const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');

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

UsuarioSchema.plugin(toJSON, { omitir: ['password'] });

module.exports = model('Usuario', UsuarioSchema);

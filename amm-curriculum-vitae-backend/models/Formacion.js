const { Schema, model } = require('mongoose');
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

FormacionSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Formacion', FormacionSchema);

const { Schema, model } = require('mongoose');

const HitoSchema = Schema({
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
  experiencia: {
    type: Schema.Types.ObjectId,
    ref: 'Experiencia',
    required: true,
  },
});

HitoSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Hito', HitoSchema);

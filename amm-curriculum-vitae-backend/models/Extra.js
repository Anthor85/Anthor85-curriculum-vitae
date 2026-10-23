const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');

const ExtraSchema = Schema({
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
  formacion: {
    type: Schema.Types.ObjectId,
    ref: 'Formacion',
    required: true,
  },
});

ExtraSchema.plugin(toJSON);

module.exports = model('Extra', ExtraSchema);

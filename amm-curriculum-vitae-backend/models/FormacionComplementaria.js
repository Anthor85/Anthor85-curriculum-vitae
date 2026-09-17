const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');
const FormacionComplementariaSchema = Schema({
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
  },
});

FormacionComplementariaSchema.plugin(toJSON);

module.exports = model(
  'FormacionComplementaria',
  FormacionComplementariaSchema,
);

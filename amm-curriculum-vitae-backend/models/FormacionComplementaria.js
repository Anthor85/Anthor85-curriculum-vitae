const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');
const { localizado } = require('./plugins/localizado');
const FormacionComplementariaSchema = Schema({
  titulo: localizado({ required: true }),
  institucion: localizado({ required: true }),
  fechaFin: {
    type: Date,
  },
});

FormacionComplementariaSchema.plugin(toJSON);

module.exports = model(
  'FormacionComplementaria',
  FormacionComplementariaSchema,
);

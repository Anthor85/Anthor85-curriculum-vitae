const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');
const { localizado } = require('./plugins/localizado');

const ExtraSchema = Schema({
  descripcion: localizado({ required: true }),
  formacion: {
    type: Schema.Types.ObjectId,
    ref: 'Formacion',
    required: true,
  },
});

ExtraSchema.plugin(toJSON);

module.exports = model('Extra', ExtraSchema);

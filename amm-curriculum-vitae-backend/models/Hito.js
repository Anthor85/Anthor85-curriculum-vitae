const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');
const { localizado } = require('./plugins/localizado');

const HitoSchema = Schema({
  descripcion: localizado({ required: true }),
  experiencia: {
    type: Schema.Types.ObjectId,
    ref: 'Experiencia',
    required: true,
  },
});

HitoSchema.plugin(toJSON);

module.exports = model('Hito', HitoSchema);

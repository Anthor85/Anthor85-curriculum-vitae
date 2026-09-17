const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');

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

HitoSchema.plugin(toJSON);

module.exports = model('Hito', HitoSchema);

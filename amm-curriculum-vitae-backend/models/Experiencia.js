const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');

const ExperienciaSchema = Schema(
  {
    empresa: {
      type: String,
      required: true,
      trim: true,
    },
    fechaInicio: {
      type: Date,
      required: true,
    },
    fechaFin: {
      type: Date,
      required: false,
      default: null,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    tecnologias: {
      type: [Schema.Types.ObjectId],
      ref: 'Conocimiento',
    },
  },
  {
    toObject: { virtuals: true },
  },
);

// Relación inversa: los hitos guardan la referencia a la experiencia.
// Solo aparece en el JSON si se ha hecho .populate("hitos").
ExperienciaSchema.virtual('hitos', {
  ref: 'Hito',
  localField: '_id',
  foreignField: 'experiencia',
});

ExperienciaSchema.plugin(toJSON, { virtuals: true });

module.exports = model('Experiencia', ExperienciaSchema);

const { Schema, model } = require('mongoose');

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
    toJSON: { virtuals: true },
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

ExperienciaSchema.method('toJSON', function () {
  const { __v, _id, hitos, ...object } = this.toObject({ virtuals: true });
  object.id = _id;
  if (Array.isArray(hitos)) {
    object.hitos = hitos.map(({ __v, _id, ...hito }) => ({
      ...hito,
      id: _id,
    }));
  }
  return object;
});

module.exports = model('Experiencia', ExperienciaSchema);

const { Schema, model } = require('mongoose');

const toJSON = require('./plugins/toJSON');
const FormacionSchema = Schema(
  {
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
  },
  {
    toObject: { virtuals: true },
  },
);

// Relación inversa: los extras guardan la referencia a la formación.
// Solo aparece en el JSON si se ha hecho .populate("extras").
FormacionSchema.virtual('extras', {
  ref: 'Extra',
  localField: '_id',
  foreignField: 'formacion',
});

FormacionSchema.plugin(toJSON, { virtuals: true });

module.exports = model('Formacion', FormacionSchema);

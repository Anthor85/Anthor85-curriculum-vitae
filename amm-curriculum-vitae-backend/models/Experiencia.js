const { Schema, model } = require("mongoose");

const ExperienciaSchema = Schema({
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
    ref: "Conocimiento",
  },
});

ExperienciaSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model("Experiencia", ExperienciaSchema);

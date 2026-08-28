const { Schema, model } = require("mongoose");

const ConocimientoSchema = Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  nivel: {
    type: String,
    required: true,
    enum: ["Básico", "Intermedio", "Avanzado"],
  },
});

ConocimientoSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model("Conocimiento", ConocimientoSchema);

const { Schema, model } = require("mongoose");
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
});

FormacionComplementariaSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model(
  "FormacionComplementaria",
  FormacionComplementariaSchema
);

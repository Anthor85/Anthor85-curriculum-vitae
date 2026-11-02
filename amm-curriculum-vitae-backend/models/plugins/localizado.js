const { Schema } = require('mongoose');

// Texto libre en los dos idiomas del CV. `es` es el original; `en` puede
// quedar vacío y entonces la API pública cae a `es`.
const localizado = ({ required = false } = {}) => ({
  type: new Schema(
    {
      es: { type: String, trim: true, required },
      en: { type: String, trim: true, default: '' },
    },
    { _id: false },
  ),
  required,
});

module.exports = { localizado };

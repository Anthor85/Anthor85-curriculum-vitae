const deepl = require('deepl-node');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');

const MAX_TEXTOS = 50;
const MAX_CARACTERES = 5000;

// Un solo cliente por instancia. Se crea en la primera petición y no al
// cargar el módulo, para que la falta de clave sea un 503 y no un fallo al
// arrancar. Una clave terminada en ":fx" usa sola el host de la API Free.
let traductor;
const obtenerTraductor = () => {
  if (!process.env.DEEPL_API_KEY) return null;
  traductor ??= new deepl.Translator(process.env.DEEPL_API_KEY);
  return traductor;
};

const validarTextos = (textos) => {
  if (
    !Array.isArray(textos) ||
    textos.length < 1 ||
    textos.length > MAX_TEXTOS
  ) {
    throw new HttpError(
      400,
      `textos debe ser un array de 1 a ${MAX_TEXTOS} elementos`,
    );
  }
  if (!textos.every((t) => typeof t === 'string' && t.trim() !== '')) {
    throw new HttpError(400, 'Cada texto debe ser un string no vacío');
  }
  if (textos.reduce((total, t) => total + t.length, 0) > MAX_CARACTERES) {
    throw new HttpError(
      400,
      `Los textos no pueden sumar más de ${MAX_CARACTERES} caracteres`,
    );
  }
};

// Sugiere la versión en inglés de los textos del admin. El resultado no se
// guarda: el admin lo revisa antes de enviarlo con el formulario.
const traducir = async (req, res) => {
  const { textos } = req.body ?? {};
  validarTextos(textos);

  const cliente = obtenerTraductor();
  if (!cliente) {
    throw new HttpError(503, 'Traducción no disponible');
  }

  let resultados;
  try {
    // deepl-node no acepta "en" a secas como destino.
    resultados = await cliente.translateText(textos, 'es', 'en-GB');
  } catch (error) {
    console.error(error);
    if (error instanceof deepl.QuotaExceededError) {
      throw new HttpError(429, 'Cuota de traducción agotada');
    }
    throw new HttpError(502, 'Error del servicio de traducción');
  }

  res.json({ textos: resultados.map(({ text }) => text) });
};

module.exports = {
  traducir: conContexto('Error al traducir', traducir),
};

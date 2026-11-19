const deepl = require('deepl-node');

// Un solo cliente por instancia. Se crea en la primera petición y no al
// cargar el módulo, para que la falta de clave no sea un fallo al arrancar.
// Una clave terminada en ":fx" usa sola el host de la API Free.
let traductor;
const obtenerTraductor = () => {
  if (!process.env.DEEPL_API_KEY) return null;
  traductor ??= new deepl.Translator(process.env.DEEPL_API_KEY);
  return traductor;
};

module.exports = { obtenerTraductor };

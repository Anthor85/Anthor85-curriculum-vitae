// Recorre el JSON ya normalizado por toJSON y sustituye cada { es, en } por un
// string: `en` si se pide inglés y está relleno; si no, `es`.
const esLocalizado = (valor) =>
  valor !== null &&
  typeof valor === 'object' &&
  !Array.isArray(valor) &&
  Object.keys(valor).sort().join() === 'en,es';

const resolverIdioma = (valor, idioma) => {
  if (Array.isArray(valor)) return valor.map((v) => resolverIdioma(v, idioma));
  if (esLocalizado(valor)) return (idioma === 'en' && valor.en) || valor.es;
  if (valor !== null && typeof valor === 'object' && !(valor instanceof Date)) {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, resolverIdioma(v, idioma)]),
    );
  }
  return valor;
};

module.exports = { resolverIdioma };

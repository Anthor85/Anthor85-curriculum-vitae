const Conocimiento = require('../models/Conocimiento');
const Experiencia = require('../models/Experiencia');
const Formacion = require('../models/Formacion');
const FormacionComplementaria = require('../models/FormacionComplementaria');
const Perfil = require('../models/Perfil');
const { conContexto } = require('../helpers/conContexto');
const { resolverIdioma } = require('../helpers/resolverIdioma');

const obtenerCurriculum = async (req, res) => {
  const [
    conocimiento,
    experiencia,
    formaciones,
    formacionesComplementarias,
    perfil,
  ] = await Promise.all([
    Conocimiento.find(),
    Experiencia.find().populate('hitos'),
    Formacion.find().populate('extras'),
    FormacionComplementaria.find(),
    Perfil.findOne(),
  ]);

  // Sin lang o con uno no soportado se resuelve en español: así el frontend
  // que aún no manda lang sigue recibiendo strings.
  const idioma = req.query.lang === 'en' ? 'en' : 'es';

  // Se serializa antes para trabajar sobre el JSON que dejan los toJSON.
  const curriculum = JSON.parse(
    JSON.stringify({
      conocimiento,
      experiencia,
      formaciones,
      formacionesComplementarias,
      perfil,
    }),
  );

  res.json(resolverIdioma(curriculum, idioma));
};

module.exports = {
  obtenerCurriculum: conContexto(
    'Error al obtener el curriculum',
    obtenerCurriculum,
  ),
};

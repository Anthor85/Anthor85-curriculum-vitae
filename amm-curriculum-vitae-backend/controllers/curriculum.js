const { response } = require('express');

const Conocimiento = require('../models/Conocimiento');
const Experiencia = require('../models/Experiencia');
const Formacion = require('../models/Formacion');
const FormacionComplementaria = require('../models/FormacionComplementaria');
const Perfil = require('../models/Perfil');
const { conContexto } = require('../helpers/conContexto');

const obtenerCurriculum = async (req, res = response) => {
  const [
    conocimiento,
    experiencia,
    formaciones,
    formacionesComplementarias,
    perfil,
  ] = await Promise.all([
    Conocimiento.find(),
    Experiencia.find().populate('hitos'),
    Formacion.find(),
    FormacionComplementaria.find(),
    Perfil.findOne(),
  ]);

  res.json({
    conocimiento,
    experiencia,
    formaciones,
    formacionesComplementarias,
    perfil,
  });
};

module.exports = {
  obtenerCurriculum: conContexto(
    'Error al obtener el curriculum',
    obtenerCurriculum,
  ),
};

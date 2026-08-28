const { response } = require("express");

const Conocimiento = require("../models/Conocimiento");
const Experiencia = require("../models/Experiencia");
const Formacion = require("../models/Formacion");
const FormacionComplementaria = require("../models/FormacionComplementaria");
const Perfil = require("../models/Perfil");

const obtenerCurriculum = async (req, res = response) => {
  try {
    res.json({
      'conocimiento': await Conocimiento.find(),
      'experiencia': await Experiencia.find(),
      'formaciones': await Formacion.find(),
      'formacionesComplementarias': await FormacionComplementaria.find(),
      'perfil': await Perfil.findOne(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener las formaciones" });
  }
};

module.exports = {
  obtenerCurriculum,
};
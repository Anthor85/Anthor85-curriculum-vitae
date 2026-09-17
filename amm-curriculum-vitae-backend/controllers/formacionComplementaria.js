const { response } = require('express');
const FormacionComplementaria = require('../models/FormacionComplementaria');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');

const obtenerFormacionesComplementarias = async (req, res = response) => {
  const formaciones = await FormacionComplementaria.find();
  res.json(formaciones);
};

const crearFormacionComplementaria = async (req, res = response) => {
  const { titulo, institucion, fechaFin } = req.body;

  const nuevaFormacion = new FormacionComplementaria({
    titulo,
    institucion,
    fechaFin: fechaFin || undefined,
  });
  await nuevaFormacion.save();
  res.status(201).json(nuevaFormacion);
};

const actualizarFormacionComplementaria = async (req, res = response) => {
  const { id } = req.params;

  const formacionComplementaria = await FormacionComplementaria.findById(id);
  if (!formacionComplementaria) {
    throw new HttpError(404, 'Formación complementaria no encontrada');
  }

  formacionComplementaria.titulo = req.body.titulo;
  formacionComplementaria.institucion = req.body.institucion;
  formacionComplementaria.fechaFin = req.body.fechaFin || undefined;

  await formacionComplementaria.save();

  res.json(formacionComplementaria);
};

const deleteFormacionComplementaria = async (req, res = response) => {
  const { id } = req.params;

  const formacionComplementariaEliminada =
    await FormacionComplementaria.findByIdAndDelete(id);
  if (!formacionComplementariaEliminada) {
    throw new HttpError(404, 'Formación complementaria no encontrada');
  }

  res.json({
    msg: 'Formación eliminada',
    formacionComplementaria: formacionComplementariaEliminada,
  });
};

module.exports = {
  obtenerFormacionesComplementarias: conContexto(
    'Error al obtener las formaciones complementarias',
    obtenerFormacionesComplementarias,
  ),
  crearFormacionComplementaria: conContexto(
    'Error al crear la formación complementaria',
    crearFormacionComplementaria,
  ),
  actualizarFormacionComplementaria: conContexto(
    'Error al actualizar la formación complementaria',
    actualizarFormacionComplementaria,
  ),
  deleteFormacionComplementaria: conContexto(
    'Error al eliminar la formación complementaria',
    deleteFormacionComplementaria,
  ),
};

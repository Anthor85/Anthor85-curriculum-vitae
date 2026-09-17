const { response } = require('express');
const Formacion = require('../models/Formacion');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');

const obtenerFormaciones = async (req, res = response) => {
  const formaciones = await Formacion.find();
  res.json(formaciones);
};

const crearFormacion = async (req, res = response) => {
  const { titulo, institucion, descripcion, fechaFin } = req.body;

  const nuevaFormacion = new Formacion({
    titulo,
    institucion,
    descripcion,
    fechaFin,
  });
  await nuevaFormacion.save();
  res.status(201).json(nuevaFormacion);
};

const actualizarFormacion = async (req, res = response) => {
  const { id } = req.params;

  const formacion = await Formacion.findById(id);
  if (!formacion) {
    throw new HttpError(404, 'Formación no encontrada');
  }

  formacion.titulo = req.body.titulo;
  formacion.institucion = req.body.institucion;
  formacion.descripcion = req.body.descripcion;
  formacion.fechaFin = req.body.fechaFin;

  await formacion.save();

  res.json(formacion);
};

const deleteFormacion = async (req, res = response) => {
  const { id } = req.params;

  const formacionEliminada = await Formacion.findByIdAndDelete(id);
  if (!formacionEliminada) {
    throw new HttpError(404, 'Formación no encontrada');
  }

  res.json({ msg: 'Formación eliminada', formacion: formacionEliminada });
};

module.exports = {
  obtenerFormaciones: conContexto(
    'Error al obtener las formaciones',
    obtenerFormaciones,
  ),
  crearFormacion: conContexto('Error al crear la formación', crearFormacion),
  actualizarFormacion: conContexto(
    'Error al actualizar la formación',
    actualizarFormacion,
  ),
  deleteFormacion: conContexto(
    'Error al eliminar la formación',
    deleteFormacion,
  ),
};

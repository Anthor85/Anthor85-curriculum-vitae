const { response } = require('express');
const Formacion = require('../models/Formacion');

const obtenerFormaciones = async (req, res = response) => {
  try {
    const formaciones = await Formacion.find();
    res.json(formaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener las formaciones' });
  }
};

const crearFormacion = async (req, res = response) => {
  const { titulo, institucion, descripcion, fechaFin } = req.body;
  console.log('Datos recibidos:', {
    titulo,
    institucion,
    descripcion,
    fechaFin,
  });
  try {
    const nuevaFormacion = new Formacion({
      titulo,
      institucion,
      descripcion,
      fechaFin,
    });
    await nuevaFormacion.save();
    res.status(201).json(nuevaFormacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear la formación' });
  }
};

const actualizarFormacion = async (req, res = response) => {
  const { id } = req.params;

  try {
    const formacion = await Formacion.findById(id);
    if (!formacion) {
      return res.status(404).json({ msg: 'Formación no encontrada' });
    }

    formacion.titulo = req.body.titulo;
    formacion.institucion = req.body.institucion;
    formacion.descripcion = req.body.descripcion;
    formacion.fechaFin = req.body.fechaFin;

    await formacion.save();

    res.json(formacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar la formación' });
  }
};

const deleteFormacion = async (req, res = response) => {
  const { id } = req.params;
  console.log('ID recibido para eliminación:', id);
  try {
    const formacion = await Formacion.findById(id);
    if (!formacion) {
      return res.status(404).json({ msg: 'Formación no encontrada' });
    }

    const formacionEliminada = await Formacion.findByIdAndDelete(id);
    res.json({ msg: 'Formación eliminada', formacion: formacionEliminada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al eliminar la formación' });
  }
};

module.exports = {
  obtenerFormaciones,
  crearFormacion,
  actualizarFormacion,
  deleteFormacion,
};

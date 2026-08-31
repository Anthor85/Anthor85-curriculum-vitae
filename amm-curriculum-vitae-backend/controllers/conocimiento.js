const { response } = require('express');
const Conocimiento = require('../models/Conocimiento');

// Obtener todos los conocimientos
const obtenerConocimientos = async (req, res = response) => {
  try {
    const conocimientos = await Conocimiento.find();
    res.json(conocimientos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener los conocimientos' });
  }
};

// Crear un nuevo conocimiento
const crearConocimiento = async (req, res = response) => {
  try {
    const nuevoConocimiento = new Conocimiento(req.body);
    const conocimientoCreado = await nuevoConocimiento.save();
    console.log('nuevo y creado', nuevoConocimiento, conocimientoCreado);

    res.status(201).json(conocimientoCreado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear el conocimiento' });
  }
};

//Crear múltiples conocimientos
const crearConocimientos = async (req, res = response) => {
  const conocimientos = req.body;

  try {
    const conocimientosCreado = await Conocimiento.insertMany(conocimientos);
    res.status(201).json(conocimientosCreado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear los conocimientos' });
  }
};

// Actualizar un conocimiento
const actualizarConocimiento = async (req, res = response) => {
  const { id } = req.params;

  try {
    const conocimiento = await Conocimiento.findById(id);
    if (!conocimiento) {
      return res.status(404).json({ msg: 'Conocimiento no encontrado' });
    }

    conocimiento.titulo = req.body.titulo;
    conocimiento.nivel = req.body.nivel;

    await conocimiento.save();

    res.json(conocimiento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar el conocimiento' });
  }
};

const eliminarConocimiento = async (req, res = response) => {
  const { id } = req.params;

  try {
    const conocimiento = await Conocimiento.findByIdAndDelete(id);
    if (!conocimiento) {
      return res.status(404).json({ msg: 'Conocimiento no encontrado' });
    }
    res.json({ msg: 'Conocimiento eliminado', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al eliminar el conocimiento' });
  }
};

module.exports = {
  obtenerConocimientos,
  crearConocimiento,
  crearConocimientos,
  actualizarConocimiento,
  eliminarConocimiento,
};

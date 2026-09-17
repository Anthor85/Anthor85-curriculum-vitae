const Conocimiento = require('../models/Conocimiento');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');

// Obtener todos los conocimientos
const obtenerConocimientos = async (req, res) => {
  const conocimientos = await Conocimiento.find();
  res.json(conocimientos);
};

// Crear un nuevo conocimiento
const crearConocimiento = async (req, res) => {
  const nuevoConocimiento = new Conocimiento(req.body);
  const conocimientoCreado = await nuevoConocimiento.save();
  res.status(201).json(conocimientoCreado);
};

//Crear múltiples conocimientos
const crearConocimientos = async (req, res) => {
  const conocimientosCreado = await Conocimiento.insertMany(req.body);
  res.status(201).json(conocimientosCreado);
};

// Actualizar un conocimiento
const actualizarConocimiento = async (req, res) => {
  const { id } = req.params;

  const conocimiento = await Conocimiento.findById(id);
  if (!conocimiento) {
    throw new HttpError(404, 'Conocimiento no encontrado');
  }

  conocimiento.titulo = req.body.titulo;
  conocimiento.nivel = req.body.nivel;

  await conocimiento.save();

  res.json(conocimiento);
};

const eliminarConocimiento = async (req, res) => {
  const { id } = req.params;

  const conocimiento = await Conocimiento.findByIdAndDelete(id);
  if (!conocimiento) {
    throw new HttpError(404, 'Conocimiento no encontrado');
  }

  res.json({ msg: 'Conocimiento eliminado', id });
};

module.exports = {
  obtenerConocimientos: conContexto(
    'Error al obtener los conocimientos',
    obtenerConocimientos,
  ),
  crearConocimiento: conContexto(
    'Error al crear el conocimiento',
    crearConocimiento,
  ),
  crearConocimientos: conContexto(
    'Error al crear los conocimientos',
    crearConocimientos,
  ),
  actualizarConocimiento: conContexto(
    'Error al actualizar el conocimiento',
    actualizarConocimiento,
  ),
  eliminarConocimiento: conContexto(
    'Error al eliminar el conocimiento',
    eliminarConocimiento,
  ),
};

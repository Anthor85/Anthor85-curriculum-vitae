const Formacion = require('../models/Formacion');
const Extra = require('../models/Extra');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');
const {
  crearDescripciones,
  reconciliarDescripciones,
} = require('../helpers/descripcionesHijas');

const obtenerFormaciones = async (req, res) => {
  const formaciones = await Formacion.find().populate('extras');
  res.json(formaciones);
};

const crearFormacion = async (req, res) => {
  const { titulo, institucion, extras, fechaFin } = req.body;

  const nuevaFormacion = new Formacion({
    titulo,
    institucion,
    fechaFin,
  });
  await nuevaFormacion.save();

  await crearDescripciones(Extra, 'formacion', nuevaFormacion._id, extras);

  const formacionCreada = await Formacion.findById(nuevaFormacion._id).populate(
    'extras',
  );

  res.status(201).json(formacionCreada);
};

const actualizarFormacion = async (req, res) => {
  const { id } = req.params;

  const formacion = await Formacion.findById(id);
  if (!formacion) {
    throw new HttpError(404, 'Formación no encontrada');
  }

  formacion.titulo = req.body.titulo;
  formacion.institucion = req.body.institucion;
  formacion.fechaFin = req.body.fechaFin;

  await formacion.save();

  await reconciliarDescripciones(Extra, 'formacion', id, req.body.extras);

  // Se relee poblada para devolver el mismo shape que el POST.
  const formacionActualizada = await Formacion.findById(id).populate('extras');

  res.json(formacionActualizada);
};

const eliminarFormacion = async (req, res) => {
  const { id } = req.params;

  const formacionEliminada = await Formacion.findByIdAndDelete(id);
  if (!formacionEliminada) {
    throw new HttpError(404, 'Formación no encontrada');
  }

  // Los extras solo se gestionan a través de la formación: sin cascada
  // quedarían huérfanos y sin forma de borrarlos.
  const { deletedCount } = await Extra.deleteMany({ formacion: id });
  res.json({
    msg: 'Formación eliminada',
    formacion: formacionEliminada,
    extrasEliminados: deletedCount,
  });
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
  eliminarFormacion: conContexto(
    'Error al eliminar la formación',
    eliminarFormacion,
  ),
};

const Experiencia = require('../models/Experiencia');
const Hito = require('../models/Hito');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');
const {
  crearDescripciones,
  reconciliarDescripciones,
} = require('../helpers/descripcionesHijas');

// Las tecnologías llegan como cadena separada por comas (o como array si el
// form manda el campo repetido). Sin filtrar los vacíos, "" produce [""] y
// el cast a ObjectId falla.
const normalizarTecnologias = (tecnologias) =>
  []
    .concat(tecnologias ?? [])
    .flatMap((tech) => String(tech).split(','))
    .map((tech) => tech.trim())
    .filter((tech) => tech !== '');

// Obtener todas las experiencias
const obtenerExperiencias = async (req, res) => {
  const experiencias = await Experiencia.find().populate('hitos');
  res.json(experiencias);
};

// Crear una nueva experiencia
const crearExperiencia = async (req, res) => {
  const { empresa, fechaInicio, fechaFin, descripcion, tecnologias, hitos } =
    req.body;

  const tecnologiasSeleccionadas = normalizarTecnologias(tecnologias);

  const nuevaExperiencia = new Experiencia({
    empresa,
    fechaInicio,
    fechaFin: fechaFin === '' ? null : fechaFin, // Si fechaFin está vacío, se guarda como null
    descripcion,
    tecnologias: tecnologiasSeleccionadas,
  });

  await nuevaExperiencia.save();

  await crearDescripciones(Hito, 'experiencia', nuevaExperiencia._id, hitos);

  const experienciaCreada = await Experiencia.findById(
    nuevaExperiencia._id,
  ).populate('hitos');

  res.status(201).json(experienciaCreada);
};

// Actualizar una experiencia completa (reemplazo, no parcial)
const actualizarExperiencia = async (req, res) => {
  const { id } = req.params;
  const { empresa, descripcion, fechaInicio, fechaFin, tecnologias, hitos } =
    req.body;

  const experiencia = await Experiencia.findById(id);
  if (!experiencia) {
    throw new HttpError(404, 'Experiencia no encontrada');
  }

  const tecnologiasSeleccionadas = normalizarTecnologias(tecnologias);

  experiencia.empresa = empresa;
  experiencia.descripcion = descripcion;
  experiencia.fechaInicio = fechaInicio;
  experiencia.fechaFin = fechaFin === '' ? null : fechaFin;
  experiencia.tecnologias = tecnologiasSeleccionadas;

  await experiencia.save();

  await reconciliarDescripciones(Hito, 'experiencia', id, hitos);

  // Se relee poblada para devolver el mismo shape que el POST y que el
  // frontend pueda reemplazar el elemento del store sin otra request.
  const experienciaActualizada =
    await Experiencia.findById(id).populate('hitos');

  res.json(experienciaActualizada);
};

const eliminarExperiencia = async (req, res) => {
  const { id } = req.params;

  const experienciaEliminada = await Experiencia.findByIdAndDelete(id);
  if (!experienciaEliminada) {
    throw new HttpError(404, 'Experiencia no encontrada');
  }

  // Los hitos solo se gestionan a través de la experiencia: sin cascada
  // quedarían huérfanos y sin forma de borrarlos.
  const { deletedCount } = await Hito.deleteMany({ experiencia: id });
  res.json({
    msg: 'Experiencia eliminada',
    experiencia: experienciaEliminada,
    hitosEliminados: deletedCount,
  });
};

module.exports = {
  obtenerExperiencias: conContexto(
    'Error al obtener las experiencias',
    obtenerExperiencias,
  ),
  crearExperiencia: conContexto(
    'Error al crear la experiencia',
    crearExperiencia,
  ),
  actualizarExperiencia: conContexto(
    'Error al actualizar la experiencia',
    actualizarExperiencia,
  ),
  eliminarExperiencia: conContexto(
    'Error al eliminar la experiencia',
    eliminarExperiencia,
  ),
};

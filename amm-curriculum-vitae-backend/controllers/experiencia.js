const Experiencia = require('../models/Experiencia');
const Hito = require('../models/Hito');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');

// Acepta ["texto", ...] (formato antiguo del form) y [{ id?, descripcion }, ...]
// (formato nuevo). Devuelve siempre [{ id, descripcion }] sin descripciones vacías.
const normalizarHitos = (hitos) =>
  []
    .concat(hitos ?? [])
    .map((hito) =>
      typeof hito === 'string'
        ? { id: undefined, descripcion: hito }
        : { id: hito?.id, descripcion: hito?.descripcion ?? '' },
    )
    .map(({ id, descripcion }) => ({
      id,
      descripcion: String(descripcion).trim(),
    }))
    .filter(({ descripcion }) => descripcion !== '');

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

  // Los hitos no se parten por comas: el texto libre puede contenerlas.
  // Al crear siempre son nuevos, así que se descarta cualquier id recibido.
  const descripciones = normalizarHitos(hitos).map(
    ({ descripcion }) => descripcion,
  );

  if (descripciones.length > 0) {
    await Hito.insertMany(
      descripciones.map((descripcion) => ({
        descripcion,
        experiencia: nuevaExperiencia._id,
      })),
    );
  }

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

  // Reconciliación de hitos por id: se conservan los _id de los que siguen
  // en el form. Un id que no pertenezca a esta experiencia (huérfano o de
  // otra) se descarta y el hito se crea nuevo, nunca se reasigna.
  const hitosNormalizados = normalizarHitos(hitos);
  const hitosEnBd = await Hito.find({ experiencia: id });
  const idsEnBd = new Set(hitosEnBd.map((hito) => String(hito._id)));

  const aActualizar = hitosNormalizados.filter(
    (hito) => hito.id && idsEnBd.has(String(hito.id)),
  );
  const aCrear = hitosNormalizados.filter(
    (hito) => !hito.id || !idsEnBd.has(String(hito.id)),
  );
  const idsRecibidos = new Set(aActualizar.map((hito) => String(hito.id)));
  const aBorrar = [...idsEnBd].filter((hitoId) => !idsRecibidos.has(hitoId));

  for (const { id: hitoId, descripcion } of aActualizar) {
    await Hito.updateOne({ _id: hitoId }, { descripcion });
  }

  if (aCrear.length > 0) {
    await Hito.insertMany(
      aCrear.map(({ descripcion }) => ({ descripcion, experiencia: id })),
    );
  }

  if (aBorrar.length > 0) {
    await Hito.deleteMany({ _id: { $in: aBorrar } });
  }

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

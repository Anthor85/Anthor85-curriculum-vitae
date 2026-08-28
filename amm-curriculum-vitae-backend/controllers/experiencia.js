const { response } = require("express");
const Experiencia = require("../models/Experiencia");
const Hito = require("../models/Hito");

// Obtener todas las experiencias
const obtenerExperiencias = async (req, res = response) => {
  try {
    const experiencias = await Experiencia.find().populate("hitos");
    res.json(experiencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener las experiencias" });
  }
};

// Crear una nueva experiencia
const crearExperiencia = async (req, res = response) => {
  const {
    titulo,
    empresa,
    fechaInicio,
    fechaFin,
    descripcion,
    tecnologias,
    hitos,
  } = req.body;

  console.log("Crear Experiencia");

  console.log("body", req.body);
  console.log("tecnologias", tecnologias);
  console.log("hitos", hitos);

  try {
    // Las tecnologías llegan como cadena separada por comas (o como array si el
    // form manda el campo repetido). Sin filtrar los vacíos, "" produce [""] y
    // el cast a ObjectId falla.
    const tecnologiasSeleccionadas = []
      .concat(tecnologias ?? [])
      .flatMap((tech) => String(tech).split(","))
      .map((tech) => tech.trim())
      .filter((tech) => tech !== "");

    const nuevaExperiencia = new Experiencia({
      titulo,
      empresa,
      fechaInicio,
      fechaFin: fechaFin === "" ? null : fechaFin, // Si fechaFin está vacío, se guarda como null
      descripcion,
      tecnologias: tecnologiasSeleccionadas,
    });
    console.log("nuevaExperiencia", nuevaExperiencia);

    await nuevaExperiencia.save();

    // Los hitos llegan como un valor por input del form: puede ser string,
    // array o nada. No se parten por comas, el texto libre puede contenerlas.
    const descripciones = []
      .concat(hitos ?? [])
      .map((hito) => String(hito).trim())
      .filter((hito) => hito !== "");

    if (descripciones.length > 0) {
      await Hito.insertMany(
        descripciones.map((descripcion) => ({
          descripcion,
          experiencia: nuevaExperiencia._id,
        }))
      );
    }

    const experienciaCreada = await Experiencia.findById(
      nuevaExperiencia._id
    ).populate("hitos");

    res.status(201).json(experienciaCreada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear la experiencia" });
  }
};

const actualizarConocimientos = async (req, res = response) => {
  const { id } = req.params;

  try {
    const experiencia = await Experiencia.findById(id);
    if (!experiencia) {
      return res.status(404).json({ msg: "Experiencia no encontrada" });
    }
    const conocimientoAActualizar = req.body;
    experiencia.conocimientos = experiencia.conocimientos.map((conocimiento) =>
      conocimiento.id === conocimientoAActualizar.id
        ? conocimientoAActualizar
        : conocimiento
    );
    await experiencia.save();
    res.json(experiencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar la experiencia" });
  }
};

const eliminarExperiencia = async (req, res = response) => {
  const { id } = req.params;

  try {
    const experienciaEliminada = await Experiencia.findByIdAndDelete(id);
    console.log("Experiencia eliminada:", experienciaEliminada);

    // Los hitos solo se gestionan a través de la experiencia: sin cascada
    // quedarían huérfanos y sin forma de borrarlos.
    const { deletedCount } = await Hito.deleteMany({ experiencia: id });
    console.log("Hitos eliminados:", deletedCount);

    res.json({
        msg: "Experiencia eliminada",
        experiencia: experienciaEliminada,
        hitosEliminados: deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar la experiencia" });
  }
};

module.exports = {
  obtenerExperiencias,
  crearExperiencia,
  actualizarConocimientos,
  eliminarExperiencia,
};

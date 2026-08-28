const { response } = require("express");
const Experiencia = require("../models/Experiencia");

// Obtener todas las experiencias
const obtenerExperiencias = async (req, res = response) => {
  try {
    const experiencias = await Experiencia.find();
    res.json(experiencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener las experiencias" });
  }
};

// Crear una nueva experiencia
const crearExperiencia = async (req, res = response) => {
  const { titulo, empresa, fechaInicio, fechaFin, descripcion, tecnologias } =
    req.body;

  console.log("Crear Experiencia");

  console.log("body", req.body);
  console.log("tecnologias", tecnologias);

  try {
    const nuevaExperiencia = new Experiencia({
      titulo,
      empresa,
      fechaInicio,
      fechaFin: fechaFin === "" ? null : fechaFin, // Si fechaFin está vacío, se guarda como null
      descripcion,
      tecnologias: tecnologias.split(",").map((tech) => tech.trim()), // Convertir la cadena en un array
    });
    console.log("nuevaExperiencia", nuevaExperiencia);

    await nuevaExperiencia.save();
    res.status(201).json(nuevaExperiencia);
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
    res.json({
        msg: "Experiencia eliminada", 
        experiencia: experienciaEliminada 
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

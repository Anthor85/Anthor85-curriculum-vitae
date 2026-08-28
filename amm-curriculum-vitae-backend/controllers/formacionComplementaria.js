const { response } = require("express");
const FormacionComplementaria = require("../models/FormacionComplementaria");

const obtenerFormacionesComplementarias = async (req, res = response) => {
  try {
    const formaciones = await FormacionComplementaria.find();
    res.json(formaciones);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: "Error al obtener las formaciones complementarias" });
  }
};

const crearFormacionComplementaria = async (req, res = response) => {
  const { titulo, institucion } = req.body;

  try {
    const nuevaFormacion = new FormacionComplementaria({
      titulo,
      institucion,
    });
    await nuevaFormacion.save();
    res.status(201).json(nuevaFormacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear la formación complementaria" });
  }
};

const deleteFormacionComplementaria = async (req, res = response) => {
    const {id} = req.params;
    console.log("ID recibido para eliminación:", id);
    try {
        const formacionComplementariaEliminada = await FormacionComplementaria.findByIdAndDelete(id);
        res.json({ msg: "Formación eliminada", formacionComplementaria: formacionComplementariaEliminada });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al eliminar la formación complementaria" });
    }
};

module.exports = {
  obtenerFormacionesComplementarias,
  crearFormacionComplementaria,
  deleteFormacionComplementaria,
};

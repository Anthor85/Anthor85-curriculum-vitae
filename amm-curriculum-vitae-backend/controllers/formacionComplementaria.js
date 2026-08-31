const { response } = require('express');
const FormacionComplementaria = require('../models/FormacionComplementaria');

const obtenerFormacionesComplementarias = async (req, res = response) => {
  try {
    const formaciones = await FormacionComplementaria.find();
    res.json(formaciones);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: 'Error al obtener las formaciones complementarias' });
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
    res.status(500).json({ msg: 'Error al crear la formación complementaria' });
  }
};

const actualizarFormacionComplementaria = async (req, res = response) => {
  const { id } = req.params;

  try {
    const formacionComplementaria = await FormacionComplementaria.findById(id);
    if (!formacionComplementaria) {
      return res
        .status(404)
        .json({ msg: 'Formación complementaria no encontrada' });
    }

    formacionComplementaria.titulo = req.body.titulo;
    formacionComplementaria.institucion = req.body.institucion;

    await formacionComplementaria.save();

    res.json(formacionComplementaria);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: 'Error al actualizar la formación complementaria' });
  }
};

const deleteFormacionComplementaria = async (req, res = response) => {
  const { id } = req.params;
  console.log('ID recibido para eliminación:', id);
  try {
    const formacionComplementaria = await FormacionComplementaria.findById(id);
    if (!formacionComplementaria) {
      return res
        .status(404)
        .json({ msg: 'Formación complementaria no encontrada' });
    }

    const formacionComplementariaEliminada =
      await FormacionComplementaria.findByIdAndDelete(id);
    res.json({
      msg: 'Formación eliminada',
      formacionComplementaria: formacionComplementariaEliminada,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: 'Error al eliminar la formación complementaria' });
  }
};

module.exports = {
  obtenerFormacionesComplementarias,
  crearFormacionComplementaria,
  actualizarFormacionComplementaria,
  deleteFormacionComplementaria,
};

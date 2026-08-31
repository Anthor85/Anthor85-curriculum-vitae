const { response } = require('express');
const Perfil = require('../models/Perfil');

const obtenerPerfil = async (req, res = response) => {
  try {
    const perfil = await Perfil.findOne();
    if (!perfil) {
      return res.status(404).json({ msg: 'Perfil no encontrado' });
    }
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener el perfil' });
  }
};

const crearPerfil = async (req, res = response) => {
  const {
    nombre,
    apellidos,
    descripcion,
    telefono,
    email,
    direccion,
    fechaNacimiento,
    foto,
  } = req.body;

  try {
    const nuevoPerfil = new Perfil({
      nombre,
      apellidos,
      descripcion,
      telefono,
      email,
      fechaNacimiento,
      direccion,
      foto: foto || undefined,
    });
    await nuevoPerfil.save();
    res.status(201).json(nuevoPerfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear el perfil' });
  }
};

const actualizarPerfil = async (req, res = response) => {
  const {
    nombre,
    apellidos,
    descripcion,
    telefono,
    email,
    direccion,
    fechaNacimiento,
    foto,
  } = req.body;

  try {
    const perfil = await Perfil.findOne();
    if (!perfil) {
      return res.status(404).json({ msg: 'Perfil no encontrado' });
    }

    perfil.nombre = nombre;
    perfil.apellidos = apellidos;
    perfil.descripcion = descripcion;
    perfil.telefono = telefono;
    perfil.email = email;
    perfil.direccion = direccion;
    perfil.fechaNacimiento = fechaNacimiento;
    perfil.foto = foto || undefined;

    await perfil.save();
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar el perfil' });
  }
};

module.exports = {
  obtenerPerfil,
  crearPerfil,
  actualizarPerfil,
};

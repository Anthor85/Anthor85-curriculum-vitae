const { response } = require('express');
const Perfil = require('../models/Perfil');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');

const obtenerPerfil = async (req, res = response) => {
  const perfil = await Perfil.findOne();
  if (!perfil) {
    throw new HttpError(404, 'Perfil no encontrado');
  }

  res.json(perfil);
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

  const perfil = await Perfil.findOne();
  if (!perfil) {
    throw new HttpError(404, 'Perfil no encontrado');
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
};

module.exports = {
  obtenerPerfil: conContexto('Error al obtener el perfil', obtenerPerfil),
  crearPerfil: conContexto('Error al crear el perfil', crearPerfil),
  actualizarPerfil: conContexto(
    'Error al actualizar el perfil',
    actualizarPerfil,
  ),
};

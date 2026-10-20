const Perfil = require('../models/Perfil');
const { HttpError } = require('../helpers/HttpError');
const { conContexto } = require('../helpers/conContexto');

const obtenerPerfil = async (req, res) => {
  const perfil = await Perfil.findOne();
  if (!perfil) {
    throw new HttpError(404, 'Perfil no encontrado');
  }

  res.json(perfil);
};

const crearPerfil = async (req, res) => {
  const {
    nombre,
    apellidos,
    descripcion,
    telefono,
    email,
    direccion,
    foto,
    linkedinURL,
    githubURL,
    disponibilidad,
    idiomas,
  } = req.body;

  const nuevoPerfil = new Perfil({
    nombre,
    apellidos,
    descripcion,
    telefono,
    email,
    direccion,
    foto: foto || undefined,
    linkedinURL: linkedinURL || undefined,
    githubURL: githubURL || undefined,
    disponibilidad: disponibilidad || undefined,
    idiomas: idiomas || [],
  });
  await nuevoPerfil.save();
  res.status(201).json(nuevoPerfil);
};

const actualizarPerfil = async (req, res) => {
  const {
    nombre,
    apellidos,
    descripcion,
    telefono,
    email,
    direccion,
    foto,
    linkedinURL,
    githubURL,
    disponibilidad,
    idiomas,
  } = req.body;

  const perfil =await Perfil.findOne();
  if (!perfil) {
    throw new HttpError(404, 'Perfil no encontrado');
  }

  perfil.nombre = nombre;
  perfil.apellidos = apellidos;
  perfil.descripcion = descripcion;
  perfil.telefono = telefono;
  perfil.email = email;
  perfil.direccion = direccion;
  perfil.foto = foto || undefined;
  perfil.linkedinURL = linkedinURL || undefined;
  perfil.githubURL = githubURL || undefined;
  perfil.disponibilidad = disponibilidad || undefined;
  perfil.idiomas = idiomas || [];

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

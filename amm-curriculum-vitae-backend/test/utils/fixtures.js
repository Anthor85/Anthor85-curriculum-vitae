const bcrypt = require('bcryptjs');

const Conocimiento = require('../../models/Conocimiento');
const Experiencia = require('../../models/Experiencia');
const Formacion = require('../../models/Formacion');
const FormacionComplementaria = require('../../models/FormacionComplementaria');
const Hito = require('../../models/Hito');
const Perfil = require('../../models/Perfil');
const Usuario = require('../../models/Usuario');

// Factorias que siembran directamente con los modelos de Mongoose. Se usan para
// preparar el estado de la base; lo que se testea son las rutas HTTP.

const crearUsuarioEnBd = async (datos = {}) => {
  const { password = '123456', ...resto } = datos;

  return Usuario.create({
    nombre: 'Antonio',
    email: 'test@test.com',
    ...resto,
    password: bcrypt.hashSync(password, bcrypt.genSaltSync()),
  });
};

const crearConocimientoEnBd = (datos = {}) =>
  Conocimiento.create({
    titulo: 'React',
    nivel: 'Avanzado',
    ...datos,
  });

const crearExperienciaEnBd = (datos = {}) =>
  Experiencia.create({
    empresa: 'Empresa de test',
    descripcion: 'Desarrollo de aplicaciones web',
    fechaInicio: '2020-01-01',
    fechaFin: null,
    tecnologias: [],
    ...datos,
  });

const crearHitoEnBd = (experienciaId, datos = {}) =>
  Hito.create({
    descripcion: 'Hito de test',
    ...datos,
    experiencia: experienciaId,
  });

const crearFormacionEnBd = (datos = {}) =>
  Formacion.create({
    titulo: 'Ingenieria Informatica',
    institucion: 'Universidad de test',
    fechaFin: '2015-06-30',
    ...datos,
  });

const crearFormacionComplementariaEnBd = (datos = {}) =>
  FormacionComplementaria.create({
    titulo: 'Curso de React',
    institucion: 'Academia de test',
    ...datos,
  });

const crearPerfilEnBd = (datos = {}) =>
  Perfil.create({
    nombre: 'Antonio',
    apellidos: 'Macian Martinez',
    email: 'test@test.com',
    telefono: '600000000',
    direccion: 'Calle de test, 1',
    fechaNacimiento: '1985-05-20',
    descripcion: 'Desarrollador full stack',
    ...datos,
  });

module.exports = {
  crearUsuarioEnBd,
  crearConocimientoEnBd,
  crearExperienciaEnBd,
  crearHitoEnBd,
  crearFormacionEnBd,
  crearFormacionComplementariaEnBd,
  crearPerfilEnBd,
};

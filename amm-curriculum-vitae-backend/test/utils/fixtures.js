const bcrypt = require('bcryptjs');

const Conocimiento = require('../../models/Conocimiento');
const Experiencia = require('../../models/Experiencia');
const Extra = require('../../models/Extra');
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
    titulo: { es: 'React', en: '' },
    prioridad: 'media',
    ...datos,
  });

const crearExperienciaEnBd = (datos = {}) =>
  Experiencia.create({
    empresa: 'Empresa de test',
    descripcion: {
      es: 'Desarrollo de aplicaciones web',
      en: 'Web application development',
    },
    fechaInicio: '2020-01-01',
    fechaFin: null,
    tecnologias: [],
    ...datos,
  });

const crearHitoEnBd = (experienciaId, datos = {}) =>
  Hito.create({
    descripcion: { es: 'Hito de test', en: 'Test milestone' },
    ...datos,
    experiencia: experienciaId,
  });

const crearFormacionEnBd = (datos = {}) =>
  Formacion.create({
    titulo: { es: 'Ingenieria Informatica', en: 'Computer Engineering' },
    institucion: { es: 'Universidad de test', en: 'Test University' },
    fechaFin: '2015-06-30',
    ...datos,
  });

const crearExtraEnBd = (formacionId, datos = {}) =>
  Extra.create({
    descripcion: { es: 'Extra de test', en: 'Test extra' },
    ...datos,
    formacion: formacionId,
  });

const crearFormacionComplementariaEnBd = (datos = {}) =>
  FormacionComplementaria.create({
    titulo: { es: 'Curso de React', en: 'React course' },
    institucion: { es: 'Academia de test', en: 'Test academy' },
    ...datos,
  });

const crearPerfilEnBd = (datos = {}) =>
  Perfil.create({
    nombre: 'Antonio',
    apellidos: 'Macian Martinez',
    email: 'test@test.com',
    telefono: '600000000',
    direccion: { es: 'Calle de test, 1', en: '1 Test Street' },
    descripcion: { es: 'Desarrollador full stack', en: 'Full stack developer' },
    ...datos,
  });

module.exports = {
  crearUsuarioEnBd,
  crearConocimientoEnBd,
  crearExperienciaEnBd,
  crearHitoEnBd,
  crearFormacionEnBd,
  crearExtraEnBd,
  crearFormacionComplementariaEnBd,
  crearPerfilEnBd,
};

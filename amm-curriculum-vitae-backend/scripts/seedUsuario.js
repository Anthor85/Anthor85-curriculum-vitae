const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { dbConnection } = require('../database/config');
const Usuario = require('../models/Usuario');

const seedUsuario = async () => {
  try {
    await dbConnection();
    console.log(`Base de datos: ${mongoose.connection.name}`);

    const email = process.env.SEED_USER_EMAIL || 'ammlink@hotmail.com';
    const password = process.env.SEED_USER_PASSWORD;

    if (!password) {
      console.error('Falta SEED_USER_PASSWORD en el .env');
      return;
    }

    const usuario = await Usuario.findOne({ email });

    if (usuario) {
      console.log(`El usuario ${email} ya existe, no se crea nada`);
      return;
    }

    const salt = bcrypt.genSaltSync();
    const nuevoUsuario = new Usuario({
      nombre: 'Antonio',
      email,
      password: bcrypt.hashSync(password, salt),
    });

    await nuevoUsuario.save();
    console.log(`Usuario ${email} creado`);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
};

seedUsuario();

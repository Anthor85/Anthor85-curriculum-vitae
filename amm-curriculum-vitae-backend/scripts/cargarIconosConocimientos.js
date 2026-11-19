const mongoose = require('mongoose');
const { dbConnection } = require('../database/config');
const Conocimiento = require('../models/Conocimiento');
const { validarIcono } = require('../helpers/validarIcono');
const iconos = require('./data/iconosConocimientos.json');

// Asigna a cada conocimiento el icono del JSON buscándolo por titulo.es.
// Idempotente: repetirlo deja los mismos iconos.
const cargarIconosConocimientos = async () => {
  try {
    // Se validan todos antes de escribir nada.
    const entradas = iconos.map(({ titulo, icono }) => {
      try {
        return { titulo, icono: validarIcono(icono) };
      } catch {
        throw new Error(`Icono no válido para "${titulo}"`);
      }
    });

    await dbConnection();
    console.log(`Base de datos: ${mongoose.connection.name}`);

    let actualizados = 0;
    let modificados = 0;
    const noEncontrados = [];

    for (const { titulo, icono } of entradas) {
      const { matchedCount, modifiedCount } = await Conocimiento.updateOne(
        { 'titulo.es': titulo },
        { $set: { icono } },
      );
      if (matchedCount === 0) {
        noEncontrados.push(titulo);
      } else {
        actualizados += 1;
        modificados += modifiedCount;
      }
    }

    noEncontrados.forEach((titulo) =>
      console.warn(`Sin coincidencia: ${titulo}`),
    );
    console.log(
      `${actualizados} actualizados (${modificados} con cambios) / ${noEncontrados.length} no encontrados`,
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

cargarIconosConocimientos();

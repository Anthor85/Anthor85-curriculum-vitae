const { Router } = require('express');
const {
  obtenerConocimientos,
  crearConocimiento,
  crearConocimientos,
  actualizarConocimiento,
  eliminarConocimiento,
} = require('../controllers/conocimiento');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

// Obtener todos los conocimientos
router.get('/', obtenerConocimientos);

// Crear un nuevo conocimiento
router.post('/', validarJWT, crearConocimiento);

// Crear múltiples conocimientos
router.post('/multiple', validarJWT, crearConocimientos);

// Actualizar un conocimiento
router.put('/:id', validarJWT, actualizarConocimiento);

// Eliminar un conocimiento
router.delete('/:id', validarJWT, eliminarConocimiento);

module.exports = router;

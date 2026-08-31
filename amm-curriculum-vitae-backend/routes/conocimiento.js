const { Router } = require('express');
const {
  obtenerConocimientos,
  crearConocimiento,
  crearConocimientos,
  eliminarConocimiento,
} = require('../controllers/conocimiento');

const router = Router();

// Obtener todos los conocimientos
router.get('/', obtenerConocimientos);

// Crear un nuevo conocimiento
router.post('/', crearConocimiento);

// Crear múltiples conocimientos
router.post('/multiple', crearConocimientos);

// Eliminar un conocimiento
router.delete('/:id', eliminarConocimiento);

module.exports = router;

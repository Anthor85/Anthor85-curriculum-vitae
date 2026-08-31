const { Router } = require('express');
const {
  obtenerExperiencias,
  crearExperiencia,
  actualizarExperiencia,
  eliminarExperiencia,
} = require('../controllers/experiencia');

const router = Router();

router.get('/', obtenerExperiencias);
router.post('/', crearExperiencia);
router.put('/:id', actualizarExperiencia);
router.delete('/:id', eliminarExperiencia);

module.exports = router;

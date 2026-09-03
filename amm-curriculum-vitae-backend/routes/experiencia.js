const { Router } = require('express');
const {
  obtenerExperiencias,
  crearExperiencia,
  actualizarExperiencia,
  eliminarExperiencia,
} = require('../controllers/experiencia');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.get('/', obtenerExperiencias);
router.post('/', validarJWT, crearExperiencia);
router.put('/:id', validarJWT, actualizarExperiencia);
router.delete('/:id', validarJWT, eliminarExperiencia);

module.exports = router;

const { Router } = require('express');
const {
  obtenerFormaciones,
  crearFormacion,
  actualizarFormacion,
  deleteFormacion,
} = require('../controllers/formacion');

const router = Router();

router.get('/', obtenerFormaciones);
router.post('/', crearFormacion);
router.put('/:id', actualizarFormacion);
router.delete('/:id', deleteFormacion);

module.exports = router;

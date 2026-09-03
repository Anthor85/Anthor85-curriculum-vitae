const { Router } = require('express');
const {
  obtenerFormaciones,
  crearFormacion,
  actualizarFormacion,
  deleteFormacion,
} = require('../controllers/formacion');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.get('/', obtenerFormaciones);
router.post('/', validarJWT, crearFormacion);
router.put('/:id', validarJWT, actualizarFormacion);
router.delete('/:id', validarJWT, deleteFormacion);

module.exports = router;

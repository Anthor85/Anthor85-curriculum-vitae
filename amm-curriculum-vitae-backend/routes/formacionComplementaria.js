const { Router } = require('express');
const {
  obtenerFormacionesComplementarias,
  crearFormacionComplementaria,
  actualizarFormacionComplementaria,
  deleteFormacionComplementaria,
} = require('../controllers/formacionComplementaria');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.get('/', obtenerFormacionesComplementarias);
router.post('/', validarJWT, crearFormacionComplementaria);
router.put('/:id', validarJWT, actualizarFormacionComplementaria);
router.delete('/:id', validarJWT, deleteFormacionComplementaria);

module.exports = router;

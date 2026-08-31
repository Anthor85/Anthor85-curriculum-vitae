const { Router } = require('express');
const {
  obtenerFormacionesComplementarias,
  crearFormacionComplementaria,
  actualizarFormacionComplementaria,
  deleteFormacionComplementaria,
} = require('../controllers/formacionComplementaria');

const router = Router();

router.get('/', obtenerFormacionesComplementarias);
router.post('/', crearFormacionComplementaria);
router.put('/:id', actualizarFormacionComplementaria);
router.delete('/:id', deleteFormacionComplementaria);

module.exports = router;

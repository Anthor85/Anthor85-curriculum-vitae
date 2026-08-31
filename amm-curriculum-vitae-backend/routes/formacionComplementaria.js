const { Router } = require('express');
const {
  obtenerFormacionesComplementarias,
  crearFormacionComplementaria,
  deleteFormacionComplementaria,
} = require('../controllers/formacionComplementaria');

const router = Router();

router.get('/', obtenerFormacionesComplementarias);
router.post('/', crearFormacionComplementaria);
router.delete('/:id', deleteFormacionComplementaria);

module.exports = router;

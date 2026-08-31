const { Router } = require('express');
const {
  obtenerPerfil,
  crearPerfil,
  actualizarPerfil,
} = require('../controllers/perfil');

const router = Router();

router.get('/', obtenerPerfil);
router.post('/', crearPerfil);
router.put('/', actualizarPerfil);

module.exports = router;

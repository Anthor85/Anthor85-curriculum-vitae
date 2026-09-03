const { Router } = require('express');
const {
  obtenerPerfil,
  crearPerfil,
  actualizarPerfil,
} = require('../controllers/perfil');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.get('/', obtenerPerfil);
router.post('/', validarJWT, crearPerfil);
router.put('/', validarJWT, actualizarPerfil);

module.exports = router;

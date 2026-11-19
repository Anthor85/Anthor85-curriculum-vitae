const { Router } = require('express');
const { buscarIconos } = require('../controllers/icono');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.get('/', validarJWT, buscarIconos);

module.exports = router;

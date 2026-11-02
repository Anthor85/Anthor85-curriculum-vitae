const { Router } = require('express');
const { traducir } = require('../controllers/traduccion');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.post('/', validarJWT, traducir);

module.exports = router;

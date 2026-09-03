const { Router } = require('express');
const { login, revalidarToken } = require('../controllers/auth');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.post('/', login);
router.get('/renew', validarJWT, revalidarToken);

module.exports = router;

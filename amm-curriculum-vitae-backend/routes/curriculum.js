const { Router } = require('express');
const { obtenerCurriculum } = require('../controllers/curriculum');

const router = Router();

router.get('/', obtenerCurriculum);
module.exports = router;

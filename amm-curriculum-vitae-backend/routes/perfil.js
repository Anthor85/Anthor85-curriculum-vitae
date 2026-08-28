const { Router } = require("express");
const { obtenerPerfil, crearPerfil } = require("../controllers/perfil");

const router = Router();

router.get("/", obtenerPerfil);
router.post("/", crearPerfil);

module.exports = router;

const { Router } = require("express");
const { obtenerFormaciones, crearFormacion, deleteFormacion } = require("../controllers/formacion");

const router = Router();

router.get("/", obtenerFormaciones);
router.post("/", crearFormacion);
router.delete("/:id", deleteFormacion);

module.exports = router;
const { Router } = require("express");
const {
  obtenerExperiencias,
  crearExperiencia,
  eliminarExperiencia,
} = require("../controllers/experiencia");

const router = Router();

router.get("/", obtenerExperiencias);
router.post("/", crearExperiencia);
router.delete("/:id", eliminarExperiencia);

module.exports = router;

const path = require("path");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { dbConnection } = require("./database/config");

//Conectar a la base de datos
dbConnection();

//Crear el servidor de express
const app = express();

// //CORS
app.use(cors());

//Directorio público
app.use(express.static("public"));

//Lectura y parseo del body
app.use(express.json());

//Rutas
app.use("/api/curriculum", require("./routes/curriculum"));
app.use("/api/conocimiento", require("./routes/conocimiento"));
app.use("/api/experiencia", require("./routes/experiencia"));
app.use("/api/formacion", require("./routes/formacion"));
app.use(
  "/api/formacionComplementaria",
  require("./routes/formacionComplementaria")
);
app.use("/api/perfil", require("./routes/perfil"));

// app.use("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "public/index.html"));
// });

app.get(/(.*)/, (req, res, next) => {
  console.log(req.path, req.params); // req.params will be { '0': '/the/path' }
  next();
});

//Escuchar peticiones (no usar el 3000)
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});

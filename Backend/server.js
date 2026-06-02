const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ===============================
// MIDDLEWARES
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// HEALTH CHECK
// ===============================
// Lo dejamos arriba para probar rápido que Azure sí está ejecutando Node.
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Servidor corriendo correctamente"
  });
});

// ===============================
// ARCHIVOS ESTÁTICOS FRONTEND
// ===============================
// IMPORTANTE:
// En Azure, App, CSS, JS e Images deben quedar al mismo nivel que server.js.
// Por eso usamos "App", "CSS", "JS", "Images" y NO "../App".
app.use(express.static(path.join(__dirname, "App")));

app.use("/CSS", express.static(path.join(__dirname, "CSS")));
app.use("/JS", express.static(path.join(__dirname, "JS")));
app.use("/Images", express.static(path.join(__dirname, "Images")));

// También dejamos /App disponible por si algún link usa /App/archivo.html
app.use("/App", express.static(path.join(__dirname, "App")));

// ===============================
// RUTAS BACKEND
// ===============================
const usuariosRoutes = require("./routes/usuarios");
const reviewsRoute = require("./routes/reviews");
const preguntasRoutes = require("./routes/preguntas");
const catalogosRoutes = require("./routes/catalogos");

// ===============================
// MOUNT DE RUTAS API
// ===============================
app.use("/api", usuariosRoutes);
app.use("/api", preguntasRoutes);
app.use("/api", catalogosRoutes);
app.use("/reviews", reviewsRoute);

// ===============================
// RUTA PRINCIPAL DEL FRONTEND
// ===============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "App", "index.html"), (err) => {
    if (err) {
      console.error("No se encontró App/index.html:", err.message);
      res.status(404).send("No se encontró el frontend App/index.html en Azure");
    }
  });
});

// ===============================
// MANEJO DE RUTAS NO ENCONTRADAS
// ===============================
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
    path: req.originalUrl
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
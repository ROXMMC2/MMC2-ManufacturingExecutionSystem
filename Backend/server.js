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
// ARCHIVOS ESTÁTICOS FRONTEND
// ===============================
// Esta línea permite abrir archivos de App directamente:
// http://localhost:3000/Auditoria.html
app.use(express.static(path.join(__dirname, "../App")));

// Estas líneas permiten cargar CSS, JS e imágenes si tus HTML los llaman como /CSS, /JS, /Images
app.use("/CSS", express.static(path.join(__dirname, "../CSS")));
app.use("/JS", express.static(path.join(__dirname, "../JS")));
app.use("/Images", express.static(path.join(__dirname, "../Images")));

// También dejamos /App disponible por si algún link viejo usa /App/archivo.html
app.use("/App", express.static(path.join(__dirname, "../App")));

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
// Cambia "index.html" por tu página principal real si se llama diferente
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../App/index.html"));
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Servidor corriendo correctamente"
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});

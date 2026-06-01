const express = require("express");
const cors = require("cors");

const app = express();

// ===============================
// MIDDLEWARES
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// RUTAS
// ===============================
const usuariosRoutes = require("./routes/usuarios");
const reviewsRoute = require("./routes/reviews");
const preguntasRoutes = require("./routes/preguntas");
const catalogosRoutes = require("./routes/catalogos");

// ===============================
// MOUNT DE RUTAS
// ===============================
app.use("/api", usuariosRoutes);
app.use("/api", preguntasRoutes);
app.use("/api", catalogosRoutes);
app.use("/reviews", reviewsRoute);

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Servidor corriendo correctamente"
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
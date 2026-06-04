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
// Sirve para validar que Azure sí está ejecutando Node correctamente.
app.get("/health", (req, res) => {
 res.json({
   ok: true,
   message: "Servidor corriendo correctamente"
 });
});
// ===============================
// DB TEST - AZURE SQL DATABASE
// ===============================
// Sirve para probar conexión directa con Azure SQL Database.
app.get("/db-test", async (req, res) => {
 try {
   const { getPool } = require("./db");
   const pool = await getPool();
   const result = await pool.request().query("SELECT GETDATE() AS now");
   res.json({
     ok: true,
     message: "Conexión a Azure SQL Database exitosa",
     now: result.recordset[0].now
   });
 } catch (error) {
   console.error("❌ ERROR REAL DB TEST:", error);
   res.status(500).json({
     ok: false,
     message: "Error conectando a Azure SQL Database",
     detalle: error.message,
     codigo: error.code || null,
     number: error.number || null,
     state: error.state || null,
     class: error.class || null,
     serverName: error.serverName || null,
     procName: error.procName || null,
     lineNumber: error.lineNumber || null
   });
 }
});
// ===============================
// ARCHIVOS ESTÁTICOS FRONTEND
// ===============================
// En Azure, App, CSS, JS e Images deben quedar al mismo nivel que server.js.
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
const actionPlansRoites = require("./routes/actionplan");
// ===============================
// MOUNT DE RUTAS API
// ===============================
// Usuarios
app.use("/api", usuariosRoutes);
// Preguntas
app.use("/api", preguntasRoutes);
// Catálogos
app.use("/api", catalogosRoutes);
// Reviews
app.use("/api/reviews", reviewsRoute);
app.use("/api/action-plans, actionPlansRoutes");
// ===============================
// RUTA PRINCIPAL DEL FRONTEND
// ===============================
app.get("/", (req, res) => {
 res.sendFile(path.join(__dirname, "App", "index.html"), (err) => {
   if (err) {
     console.error("No se encontró App/index.html:", err.message);
     res.status(404).send(`
<h1>No se encontró el frontend</h1>
<p>Azure está buscando el archivo:</p>
<pre>${path.join(__dirname, "App", "index.html")}</pre>
<p>Revisa que la carpeta App y el archivo index.html existan en C:\\home\\site\\wwwroot.</p>
     `);
   }
 });
});
// ===============================
// MANEJO DE RUTAS NO ENCONTRADAS
// ===============================
// Este bloque SIEMPRE debe ir después de todas las rutas.
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
 console.log(`Servidor corriendo en puerto ${PORT}`);
});
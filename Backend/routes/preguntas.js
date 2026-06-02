const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../db");
// ======================================================
// HELPERS
// ======================================================
function toInt(value) {
 const n = Number(value);
 if (!Number.isFinite(n)) {
   return null;
 }
 return n;
}
function isValidPositiveInt(value) {
 const n = Number(value);
 return Number.isFinite(n) && n > 0;
}
// ======================================================
// GET /api/modulos
// Obtener todos los módulos
// ======================================================
router.get("/modulos", async (req, res) => {
 try {
   const pool = await getPool();
   // Se corrigió el string de la consulta SQL
   const result = await pool.request().query(`
     SELECT
       idmodulo,
       nombre
     FROM dbo.modulos
     ORDER BY idmodulo ASC
   `);
   res.json(result.recordset);
 } catch (error) {
   console.error("❌ Error obteniendo módulos:", error);
   res.status(500).json({
     ok: false,
     error: "Error obteniendo módulos",
     detalle: error.message,
     codigo: error.code || null,
     number: error.number || null,
     lineNumber: error.lineNumber || null
   });
 }
});
// ======================================================
// GET /api/preguntas
// Obtener todas las preguntas con su módulo
// ======================================================
router.get("/preguntas", async (req, res) => {
 try {
   const pool = await getPool();
   const result = await pool.request().query(`
     SELECT
       p.idpregunta,
       p.idmodulo,
       m.nombre AS modulo,
       p.texto,
       p.orden
     FROM dbo.preguntas p
     INNER JOIN dbo.modulos m
       ON p.idmodulo = m.idmodulo
     ORDER BY
       p.idmodulo ASC,
       p.orden ASC,
       p.idpregunta ASC
   `);
   res.json(result.recordset);
 } catch (error) {
   console.error("❌ Error obteniendo preguntas:", error);
   res.status(500).json({
     ok: false,
     error: "Error obteniendo preguntas",
     detalle: error.message,
     codigo: error.code || null,
     number: error.number || null,
     lineNumber: error.lineNumber || null
   });
 }
});
// ======================================================
// POST /api/preguntas
// Crear pregunta
// Body esperado:
// {
//   "texto": "Nueva pregunta",
//   "idmodulo": 1,
//   "orden": 1
// }
// ======================================================
router.post("/preguntas", async (req, res) => {
 const texto = String(req.body.texto || "").trim();
 const idmodulo = toInt(req.body.idmodulo);
 const ordenBody =
   req.body.orden === null ||
   req.body.orden === undefined ||
   req.body.orden === ""
     ? null
     : toInt(req.body.orden);
 if (!texto) {
   return res.status(400).json({
     ok: false,
     error: "El texto de la pregunta es obligatorio."
   });
 }
 if (!isValidPositiveInt(idmodulo)) {
   return res.status(400).json({
     ok: false,
     error: "El idmodulo es obligatorio y debe ser numérico."
   });
 }
 if (ordenBody !== null && !isValidPositiveInt(ordenBody)) {
   return res.status(400).json({
     ok: false,
     error: "El número de pregunta debe ser mayor o igual a 1."
   });
 }
 const pool = await getPool();
 const transaction = new sql.Transaction(pool);
 try {
   await transaction.begin();
   // Validar que exista el módulo
   const moduloRequest = new sql.Request(transaction);
   const moduloExiste = await moduloRequest
     .input("idmodulo", sql.Int, idmodulo)
     .query(`
       SELECT TOP 1
         idmodulo
       FROM dbo.modulos
       WHERE idmodulo = @idmodulo
     `);
   if (moduloExiste.recordset.length === 0) {
     await transaction.rollback();
     return res.status(404).json({
       ok: false,
       error: "El módulo seleccionado no existe."
     });
   }
   // Obtener el máximo orden actual del módulo
   const maxOrdenRequest = new sql.Request(transaction);
   const maxOrdenResult = await maxOrdenRequest
     .input("idmodulo", sql.Int, idmodulo)
     .query(`
       SELECT
         ISNULL(MAX(orden), 0) AS maxOrden
       FROM dbo.preguntas
       WHERE idmodulo = @idmodulo
     `);
   const maxOrden = Number(maxOrdenResult.recordset[0].maxOrden || 0);
   let ordenFinal = ordenBody;
   // Si no mandan orden, asigna el siguiente
   if (ordenFinal === null) {
     ordenFinal = maxOrden + 1;
   }
   // Si mandan un orden mayor al máximo permitido, se ajusta
   if (ordenFinal > maxOrden + 1) {
     ordenFinal = maxOrden + 1;
   }
   // Abrir espacio si insertan en una posición ya existente
   const shiftRequest = new sql.Request(transaction);
   await shiftRequest
     .input("idmodulo", sql.Int, idmodulo)
     .input("ordenFinal", sql.Int, ordenFinal)
     .query(`
       UPDATE dbo.preguntas
       SET orden = orden + 1
       WHERE idmodulo = @idmodulo
         AND orden >= @ordenFinal
     `);
   // Insertar pregunta
   const insertRequest = new sql.Request(transaction);
   const result = await insertRequest
     .input("texto", sql.NVarChar(255), texto)
     .input("idmodulo", sql.Int, idmodulo)
     .input("orden", sql.Int, ordenFinal)
     .query(`
       INSERT INTO dbo.preguntas (
         texto,
         idmodulo,
         orden
       )
       OUTPUT
         INSERTED.idpregunta,
         INSERTED.texto,
         INSERTED.idmodulo,
         INSERTED.orden
       VALUES (
         @texto,
         @idmodulo,
         @orden
       )
     `);
   await transaction.commit();
   res.status(201).json({
     ok: true,
     message: "Pregunta creada correctamente.",
     pregunta: result.recordset[0]
   });
 } catch (error) {
   try {
     await transaction.rollback();
   } catch (rollbackError) {
     console.error("❌ Error haciendo rollback:", rollbackError);
   }
   console.error("❌ Error creando pregunta:", error);
   res.status(500).json({
     ok: false,
     error: "Error creando pregunta",
     detalle: error.message,
     codigo: error.code || null,
     number: error.number || null,
     lineNumber: error.lineNumber || null
   });
 }
});
// ======================================================
// PUT /api/preguntas/:id
// Actualizar pregunta y reordenar
// Body esperado:
// {
//   "texto": "Pregunta editada",
//   "idmodulo": 1,
//   "orden": 2
// }
// ======================================================
router.put("/preguntas/:id", async (req, res) => {
 const id = toInt(req.params.id);
 const texto = String(req.body.texto || "").trim();
 const idmodulo = toInt(req.body.idmodulo);
 const ordenNuevoRaw = toInt(req.body.orden);
 if (!isValidPositiveInt(id)) {
   return res.status(400).json({
     ok: false,
     error: "El ID de la pregunta no es válido."
   });
 }
 if (!texto) {
   return res.status(400).json({
     ok: false,
     error: "El texto de la pregunta es obligatorio."
   });
 }
 if (!isValidPositiveInt(idmodulo)) {
   return res.status(400).json({
     ok: false,
     error: "El idmodulo es obligatorio y debe ser numérico."
   });
 }
 if (!isValidPositiveInt(ordenNuevoRaw)) {
   return res.status(400).json({
     ok: false,
     error: "El número de pregunta es obligatorio y debe ser mayor o igual a 1."
   });
 }
 const pool = await getPool();
 const transaction = new sql.Transaction(pool);
 try {
   await transaction.begin();
   // Obtener pregunta actual
   const preguntaActualRequest = new sql.Request(transaction);
   const preguntaActualResult = await preguntaActualRequest
     .input("idpregunta", sql.Int, id)
     .query(`
       SELECT TOP 1
         idpregunta,
         texto,
         idmodulo,
         orden
       FROM dbo.preguntas
       WHERE idpregunta = @idpregunta
     `);
   if (preguntaActualResult.recordset.length === 0) {
     await transaction.rollback();
     return res.status(404).json({
       ok: false,
       error: "La pregunta no existe."
     });
   }
   const preguntaActual = preguntaActualResult.recordset[0];
   const moduloAnterior = Number(preguntaActual.idmodulo);
   const ordenAnterior = Number(preguntaActual.orden);
   // Validar módulo destino
   const moduloRequest = new sql.Request(transaction);
   const moduloExiste = await moduloRequest
     .input("idmodulo", sql.Int, idmodulo)
     .query(`
       SELECT TOP 1
         idmodulo
       FROM dbo.modulos
       WHERE idmodulo = @idmodulo
     `);
   if (moduloExiste.recordset.length === 0) {
     await transaction.rollback();
     return res.status(404).json({
       ok: false,
       error: "El módulo seleccionado no existe."
     });
   }
   // Contar preguntas en módulo destino, excluyendo la actual
   const countRequest = new sql.Request(transaction);
   const countResult = await countRequest
     .input("idmodulo", sql.Int, idmodulo)
     .input("idpregunta", sql.Int, id)
     .query(`
       SELECT
         COUNT(*) AS total
       FROM dbo.preguntas
       WHERE idmodulo = @idmodulo
         AND idpregunta <> @idpregunta
     `);
   const totalDestino = Number(countResult.recordset[0].total || 0);
   let ordenNuevo = ordenNuevoRaw;
   if (ordenNuevo > totalDestino + 1) {
     ordenNuevo = totalDestino + 1;
   }
   // Si solo cambió texto
   if (moduloAnterior === idmodulo && ordenAnterior === ordenNuevo) {
     const updateTextRequest = new sql.Request(transaction);
     const result = await updateTextRequest
       .input("idpregunta", sql.Int, id)
       .input("texto", sql.NVarChar(255), texto)
       .query(`
         UPDATE dbo.preguntas
         SET texto = @texto
         OUTPUT
           INSERTED.idpregunta,
           INSERTED.texto,
           INSERTED.idmodulo,
           INSERTED.orden
         WHERE idpregunta = @idpregunta
       `);
     await transaction.commit();
     return res.json({
       ok: true,
       message: "Pregunta actualizada correctamente.",
       pregunta: result.recordset[0]
     });
   }
   // Mover temporalmente para evitar conflicto con UNIQUE(idmodulo, orden)
   const tempRequest = new sql.Request(transaction);
   await tempRequest
     .input("idpregunta", sql.Int, id)
     .input("ordenTemporal", sql.Int, -999999)
     .query(`
       UPDATE dbo.preguntas
       SET orden = @ordenTemporal
       WHERE idpregunta = @idpregunta
     `);
   // Caso 1: mismo módulo
   if (moduloAnterior === idmodulo) {
     if (ordenNuevo < ordenAnterior) {
       const shiftDownRequest = new sql.Request(transaction);
       await shiftDownRequest
         .input("idmodulo", sql.Int, idmodulo)
         .input("ordenNuevo", sql.Int, ordenNuevo)
         .input("ordenAnterior", sql.Int, ordenAnterior)
         .input("idpregunta", sql.Int, id)
         .query(`
           UPDATE dbo.preguntas
           SET orden = orden + 1
           WHERE idmodulo = @idmodulo
             AND orden >= @ordenNuevo
             AND orden < @ordenAnterior
             AND idpregunta <> @idpregunta
         `);
     } else if (ordenNuevo > ordenAnterior) {
       const shiftUpRequest = new sql.Request(transaction);
       await shiftUpRequest
         .input("idmodulo", sql.Int, idmodulo)
         .input("ordenAnterior", sql.Int, ordenAnterior)
         .input("ordenNuevo", sql.Int, ordenNuevo)
         .input("idpregunta", sql.Int, id)
         .query(`
           UPDATE dbo.preguntas
           SET orden = orden - 1
           WHERE idmodulo = @idmodulo
             AND orden > @ordenAnterior
             AND orden <= @ordenNuevo
             AND idpregunta <> @idpregunta
         `);
     }
     const updateRequest = new sql.Request(transaction);
     const result = await updateRequest
       .input("idpregunta", sql.Int, id)
       .input("texto", sql.NVarChar(255), texto)
       .input("idmodulo", sql.Int, idmodulo)
       .input("orden", sql.Int, ordenNuevo)
       .query(`
         UPDATE dbo.preguntas
         SET
           texto = @texto,
           idmodulo = @idmodulo,
           orden = @orden
         OUTPUT
           INSERTED.idpregunta,
           INSERTED.texto,
           INSERTED.idmodulo,
           INSERTED.orden
         WHERE idpregunta = @idpregunta
       `);
     await transaction.commit();
     return res.json({
       ok: true,
       message: "Pregunta actualizada correctamente.",
       pregunta: result.recordset[0]
     });
   }
   // Caso 2: cambia de módulo
   // Cerrar hueco en módulo anterior
   const closeOldGapRequest = new sql.Request(transaction);
   await closeOldGapRequest
     .input("moduloAnterior", sql.Int, moduloAnterior)
     .input("ordenAnterior", sql.Int, ordenAnterior)
     .query(`
       UPDATE dbo.preguntas
       SET orden = orden - 1
       WHERE idmodulo = @moduloAnterior
         AND orden > @ordenAnterior
     `);
   // Abrir espacio en módulo nuevo
   const openNewGapRequest = new sql.Request(transaction);
   await openNewGapRequest
     .input("idmodulo", sql.Int, idmodulo)
     .input("ordenNuevo", sql.Int, ordenNuevo)
     .query(`
       UPDATE dbo.preguntas
       SET orden = orden + 1
       WHERE idmodulo = @idmodulo
         AND orden >= @ordenNuevo
     `);
   // Mover pregunta
   const updateMoveRequest = new sql.Request(transaction);
   const result = await updateMoveRequest
     .input("idpregunta", sql.Int, id)
     .input("texto", sql.NVarChar(255), texto)
     .input("idmodulo", sql.Int, idmodulo)
     .input("orden", sql.Int, ordenNuevo)
     .query(`
       UPDATE dbo.preguntas
       SET
         texto = @texto,
         idmodulo = @idmodulo,
         orden = @orden
       OUTPUT
         INSERTED.idpregunta,
         INSERTED.texto,
         INSERTED.idmodulo,
         INSERTED.orden
       WHERE idpregunta = @idpregunta
     `);
   await transaction.commit();
   return res.json({
     ok: true,
     message: "Pregunta actualizada correctamente.",
     pregunta: result.recordset[0]
   });
 } catch (error) {
   try {
     await transaction.rollback();
   } catch (rollbackError) {
     console.error("❌ Error haciendo rollback:", rollbackError);
   }
   console.error("❌ Error actualizando pregunta:", error);
   res.status(500).json({
     ok: false,
     error: "Error actualizando pregunta",
     detalle: error.message,
     codigo: error.code || null,
     number: error.number || null,
     lineNumber: error.lineNumber || null
   });
 }
});
// ======================================================
// DELETE /api/preguntas/:id
// Eliminar pregunta y reordenar módulo
// ======================================================
router.delete("/preguntas/:id", async (req, res) => {
 const id = toInt(req.params.id);
 if (!isValidPositiveInt(id)) {
   return res.status(400).json({
     ok: false,
     error: "El ID de la pregunta no es válido."
   });
 }
 const pool = await getPool();
 const transaction = new sql.Transaction(pool);
 try {
   await transaction.begin();
   // Validar pregunta
   const preguntaRequest = new sql.Request(transaction);
   const preguntaExiste = await preguntaRequest
     .input("idpregunta", sql.Int, id)
     .query(`
       SELECT TOP 1
         idpregunta,
         idmodulo,
         orden
       FROM dbo.preguntas
       WHERE idpregunta = @idpregunta
     `);
   if (preguntaExiste.recordset.length === 0) {
     await transaction.rollback();
     return res.status(404).json({
       ok: false,
       error: "La pregunta no existe."
     });
   }
   const pregunta = preguntaExiste.recordset[0];
   const idmodulo = Number(pregunta.idmodulo);
   const ordenEliminado = Number(pregunta.orden);
   // Eliminar pregunta
   const deleteRequest = new sql.Request(transaction);
   await deleteRequest
     .input("idpregunta", sql.Int, id)
     .query(`
       DELETE FROM dbo.preguntas
       WHERE idpregunta = @idpregunta
     `);
   // Reordenar
   const reorderRequest = new sql.Request(transaction);
   await reorderRequest
     .input("idmodulo", sql.Int, idmodulo)
     .input("ordenEliminado", sql.Int, ordenEliminado)
     .query(`
       UPDATE dbo.preguntas
       SET orden = orden - 1
       WHERE idmodulo = @idmodulo
         AND orden > @ordenEliminado
     `);
   await transaction.commit();
   res.json({
     ok: true,
     message: "Pregunta eliminada correctamente."
   });
 } catch (error) {
   try {
     await transaction.rollback();
   } catch (rollbackError) {
     console.error("❌ Error haciendo rollback:", rollbackError);
   }
   console.error("❌ Error eliminando pregunta:", error);
   if (error.number === 547) {
     return res.status(409).json({
       ok: false,
       error: "No se puede eliminar la pregunta porque ya está relacionada con auditorías o respuestas."
     });
   }
   res.status(500).json({
     ok: false,
     error: "Error eliminando pregunta",
     detalle: error.message,
     codigo: error.code || null,
     number: error.number || null,
     lineNumber: error.lineNumber || null
   });
 }
});
module.exports = router;
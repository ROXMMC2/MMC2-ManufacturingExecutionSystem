const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../db");
// ======================================================
// HELPERS
// ======================================================
function toNumericId(value) {
 if (value === null || value === undefined) return null;
 const text = String(value).trim();
 if (!/^\d+$/.test(text)) {
   return null;
 }
 return Number(text);
}
function normalizeText(value) {
 return String(value || "").trim();
}
function sanitizeFechaReview(value) {
  const text = normalizeText(value);

  if (!text) return null;
  const limpio = text
    .replace("T", " ")
    .replace("Z", "")
    .split(".")[0]
    .trim();

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(limpio)) {
    return limpio;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
    return `${limpio} 00:00:00`;
  }

  return null;
}
// ======================================================
// RESOLVER USUARIO
// ======================================================
async function resolveUserId(transaction, { IdUsuario, NombreUsuario }) {
 const numericId = toNumericId(IdUsuario);
 if (numericId !== null) {
   const result = await new sql.Request(transaction)
     .input("idusuario", sql.Int, numericId)
     .query(`
       SELECT TOP 1
         idusuario
       FROM dbo.usuarios
       WHERE idusuario = @idusuario
     `);
   if (result.recordset.length > 0) {
     return result.recordset[0].idusuario;
   }
 }
 const nombre = normalizeText(NombreUsuario || IdUsuario);
 if (!nombre) {
   throw new Error("No se pudo resolver IdUsuario / NombreUsuario.");
 }
 const result = await new sql.Request(transaction)
   .input("nombre", sql.NVarChar(150), nombre)
   .query(`
     SELECT TOP 1
       idusuario
     FROM dbo.usuarios
     WHERE LOWER(nombre) = LOWER(@nombre)
        OR LOWER(usuario) = LOWER(@nombre)
     ORDER BY idusuario ASC
   `);
 if (result.recordset.length === 0) {
   throw new Error(`No se encontró el usuario en la base de datos: ${nombre}`);
 }
 return result.recordset[0].idusuario;
}
// ======================================================
// RESOLVER BUSINESS UNIT
// ======================================================
async function resolveBusinessUnitId(transaction, { IdBusinessUnit, NombreBusinessUnit }) {
 const numericId = toNumericId(IdBusinessUnit);
 if (numericId !== null) {
   const result = await new sql.Request(transaction)
     .input("idbusinessunit", sql.Int, numericId)
     .query(`
       SELECT TOP 1
         idbusinessunit
       FROM dbo.businessunit
       WHERE idbusinessunit = @idbusinessunit
     `);
   if (result.recordset.length > 0) {
     return result.recordset[0].idbusinessunit;
   }
 }
 const nombre = normalizeText(NombreBusinessUnit || IdBusinessUnit);
 if (!nombre) {
   throw new Error("No se pudo resolver IdBusinessUnit / NombreBusinessUnit.");
 }
 const result = await new sql.Request(transaction)
   .input("nombre", sql.NVarChar(150), nombre)
   .query(`
     SELECT TOP 1
       idbusinessunit
     FROM dbo.businessunit
     WHERE LOWER(nombre) = LOWER(@nombre)
     ORDER BY idbusinessunit ASC
   `);
 if (result.recordset.length === 0) {
   throw new Error(`No se encontró la Business Unit en la base de datos: ${nombre}`);
 }
 return result.recordset[0].idbusinessunit;
}
// ======================================================
// RESOLVER PRODUCTION LINE
// ======================================================
async function resolveProductionLineId(transaction, {
 IdProductionLine,
 NombreProductionLine,
 idBusinessUnit
}) {
 const numericId = toNumericId(IdProductionLine);
 if (numericId !== null) {
   const result = await new sql.Request(transaction)
     .input("idproductionline", sql.Int, numericId)
     .query(`
       SELECT TOP 1
         idproductionline
       FROM dbo.productionline
       WHERE idproductionline = @idproductionline
     `);
   if (result.recordset.length > 0) {
     return result.recordset[0].idproductionline;
   }
 }
 const nombre = normalizeText(NombreProductionLine || IdProductionLine);
 if (!nombre) {
   throw new Error("No se pudo resolver IdProductionLine / NombreProductionLine.");
 }
 if (idBusinessUnit) {
   const result = await new sql.Request(transaction)
     .input("nombre", sql.NVarChar(150), nombre)
     .input("idbusinessunit", sql.Int, idBusinessUnit)
     .query(`
       SELECT TOP 1
         idproductionline
       FROM dbo.productionline
       WHERE LOWER(nombre) = LOWER(@nombre)
         AND idbusinessunit = @idbusinessunit
       ORDER BY idproductionline ASC
     `);
   if (result.recordset.length > 0) {
     return result.recordset[0].idproductionline;
   }
 }
 const result = await new sql.Request(transaction)
   .input("nombre", sql.NVarChar(150), nombre)
   .query(`
     SELECT TOP 1
       idproductionline
     FROM dbo.productionline
     WHERE LOWER(nombre) = LOWER(@nombre)
     ORDER BY idproductionline ASC
   `);
 if (result.recordset.length === 0) {
   throw new Error(`No se encontró la Production Line en la base de datos: ${nombre}`);
 }
 return result.recordset[0].idproductionline;
}
// ======================================================
// POST /reviews/guardar
// GUARDAR REVIEW
// Acepta IDs numéricos o nombres enviados desde frontend
// ======================================================
router.post("/guardar", async (req, res) => {
 const pool = await getPool();
 const transaction = new sql.Transaction(pool);
 try {
   const {
     IdUsuario,
     IdBusinessUnit,
     IdProductionLine,
     NombreUsuario,
     NombreBusinessUnit,
     NombreProductionLine,
     FechaReview,
     respuestas
   } = req.body || {};
   if (!Array.isArray(respuestas) || respuestas.length === 0) {
     return res.status(400).json({
       ok: false,
       error: "No se recibieron respuestas para guardar."
     });
   }
   await transaction.begin();
   const idUsuarioReal = await resolveUserId(transaction, {
     IdUsuario,
     NombreUsuario
   });
   const idBusinessUnitReal = await resolveBusinessUnitId(transaction, {
     IdBusinessUnit,
     NombreBusinessUnit
   });
   const idProductionLineReal = await resolveProductionLineId(transaction, {
     IdProductionLine,
     NombreProductionLine,
     idBusinessUnit: idBusinessUnitReal
   });

  const fechaReviewSanitizada = sanitizeFechaReview(FechaReview);
  let reviewResult;

  if (fechaReviewSanitizada) {
    reviewResult = await new sql.Request(transaction)
      .input("idusuario", sql.Int, idUsuarioReal)
      .input("idbusinessunit", sql.Int, idBusinessUnitReal)
      .input("idproductionline", sql.Int, idProductionLineReal)

      // IMPORTANTE:
      // Se manda como texto para evitar desfase de zona horaria en Azure/Node.
      .input("fechareview", sql.NVarChar(19), fechaReviewSanitizada)

      .query(`
        INSERT INTO dbo.reviews (
          idusuario,
          idbusinessunit,
          idproductionline,
          fechareview
        )
        OUTPUT INSERTED.idreview
        VALUES (
          @idusuario,
          @idbusinessunit,
          @idproductionline,
          CONVERT(datetime2(0), @fechareview, 120)
        )
      `);
  } else {
    reviewResult = await new sql.Request(transaction)
      .input("idusuario", sql.Int, idUsuarioReal)
      .input("idbusinessunit", sql.Int, idBusinessUnitReal)
      .input("idproductionline", sql.Int, idProductionLineReal)
      .query(`
        INSERT INTO dbo.reviews (
          idusuario,
          idbusinessunit,
          idproductionline,
          fechareview
        )
        OUTPUT INSERTED.idreview
        VALUES (
          @idusuario,
          @idbusinessunit,
          @idproductionline,
          CONVERT(
            datetime2(0),
            CONVERT(varchar(19), SYSDATETIMEOFFSET() AT TIME ZONE 'Central Standard Time (Mexico)', 120),
            120
          )
        )
      `);
  }
   const idReview = reviewResult.recordset[0].idreview;
   for (const r of respuestas) {
     const idPregunta = toNumericId(r.IdPregunta);
     const puntuacion = Number(r.Puntuacion);
     const comentario = r.Comentario ?? "";
     if (idPregunta === null) {
       throw new Error(`IdPregunta inválido: ${r.IdPregunta}`);
     }
     if (!Number.isFinite(puntuacion)) {
       throw new Error(`Puntuacion inválida para la pregunta ${idPregunta}`);
     }
     await new sql.Request(transaction)
       .input("idreview", sql.Int, idReview)
       .input("idpregunta", sql.Int, idPregunta)
       .input("puntuacion", sql.Int, puntuacion)
       .input("comentario", sql.NVarChar(sql.MAX), String(comentario))
       .query(`
         INSERT INTO dbo.respuestas (
           idreview,
           idpregunta,
           puntuacion,
           comentario
         )
         VALUES (
           @idreview,
           @idpregunta,
           @puntuacion,
           @comentario
         )
       `);
   }
   await transaction.commit();
   return res.json({
     ok: true,
     message: "Review guardada correctamente",
     idReview,
     idsResueltos: {
       idUsuario: idUsuarioReal,
       idBusinessUnit: idBusinessUnitReal,
       idProductionLine: idProductionLineReal
     }
   });
 } catch (error) {
   try {
     await transaction.rollback();
   } catch (rollbackError) {
     console.error("Error haciendo rollback en /reviews/guardar:", rollbackError);
   }
   console.error("ERROR EN /reviews/guardar:", error);
   return res.status(500).json({
     ok: false,
     error: error.message || "Error interno del servidor al guardar la review.",
     detalle: error.message,
     number: error.number || null,
     lineNumber: error.lineNumber || null
   });
 }
});
// ======================================================
// GET /reviews/detalle/:idreview
// OBTENER DETALLE DE UN REVIEW
// ======================================================
router.get("/detalle/:idreview", async (req, res) => {
 try {
   const idreview = toNumericId(req.params.idreview);
   if (idreview === null) {
     return res.status(400).json({
       ok: false,
       error: "idreview inválido."
     });
   }
   const pool = await getPool();
   const result = await pool.request()
     .input("idreview", sql.Int, idreview)
     .query(`
       SELECT
         r.idreview,
         CONVERT(varchar(19), r.fechareview, 120) AS fechareview,
         u.nombre AS usuario,
         b.nombre AS businessunit,
         p.nombre AS productionline,
         resp.idpregunta,
         q.texto AS pregunta,
         resp.puntuacion,
         resp.comentario
       FROM dbo.respuestas resp
       INNER JOIN dbo.reviews r
         ON resp.idreview = r.idreview
       INNER JOIN dbo.usuarios u
         ON r.idusuario = u.idusuario
       INNER JOIN dbo.businessunit b
         ON r.idbusinessunit = b.idbusinessunit
       INNER JOIN dbo.productionline p
         ON r.idproductionline = p.idproductionline
       INNER JOIN dbo.preguntas q
         ON resp.idpregunta = q.idpregunta
       WHERE resp.idreview = @idreview
       ORDER BY resp.idpregunta ASC
     `);
   res.json(result.recordset);
 } catch (error) {
   console.error("ERROR EN /reviews/detalle:", error);
   res.status(500).json({
     ok: false,
     message: "Error interno del servidor",
     detalle: error.message
   });
 }
});
// ======================================================
// GET /reviews/todos
// OBTENER TODOS LOS REVIEWS CON SUS RESPUESTAS
// ======================================================
router.get("/todos", async (req, res) => {
 try {
   const pool = await getPool();
   const result = await pool.request().query(`
     SELECT
       r.idreview,
       CONVERT(varchar(19), r.fechareview, 120) AS fechareview,
       u.nombre AS usuario,
       b.nombre AS businessunit,
       p.nombre AS productionline,
       resp.idpregunta,
       q.texto AS pregunta,
       resp.puntuacion,
       resp.comentario
     FROM dbo.respuestas resp
     INNER JOIN dbo.reviews r
       ON resp.idreview = r.idreview
     INNER JOIN dbo.usuarios u
       ON r.idusuario = u.idusuario
     INNER JOIN dbo.businessunit b
       ON r.idbusinessunit = b.idbusinessunit
     INNER JOIN dbo.productionline p
       ON r.idproductionline = p.idproductionline
     INNER JOIN dbo.preguntas q
       ON resp.idpregunta = q.idpregunta
     ORDER BY
       r.fechareview ASC,
       r.idreview ASC,
       resp.idpregunta ASC
   `);
   res.json(result.recordset);
 } catch (error) {
   console.error("ERROR EN /reviews/todos:", error);
   res.status(500).json({
     ok: false,
     message: "Error interno del servidor",
     detalle: error.message
   });
 }
});
// ======================================================
// GET /reviews/lista
// LISTA DE REVIEWS SIN RESPUESTAS
// ======================================================
router.get("/lista", async (req, res) => {
 try {
   const pool = await getPool();
   const result = await pool.request().query(`
     SELECT
       r.idreview,
       CONVERT(varchar(19), r.fechareview, 120) AS fechareview,
       u.nombre AS usuario,
       b.nombre AS businessunit,
       p.nombre AS productionline
     FROM dbo.reviews r
     INNER JOIN dbo.usuarios u
       ON r.idusuario = u.idusuario
     INNER JOIN dbo.businessunit b
       ON r.idbusinessunit = b.idbusinessunit
     INNER JOIN dbo.productionline p
       ON r.idproductionline = p.idproductionline
     ORDER BY
       r.fechareview ASC,
       r.idreview ASC
   `);
   res.json(result.recordset);
 } catch (error) {
   console.error("ERROR EN /reviews/lista:", error);
   res.status(500).json({
     ok: false,
     message: "Error interno del servidor",
     detalle: error.message
   });
 }
});
module.exports = router;
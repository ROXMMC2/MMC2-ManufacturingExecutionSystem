const express = require("express");
const router = express.Router();
const pool = require("../db");

// ======================================================
// HELPERS
// ======================================================
function toNumericId(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return /^\d+$/.test(text) ? Number(text) : null;
}

function normalizeText(value) {
  return String(value || "").trim();
}

async function resolveUserId(client, { IdUsuario, NombreUsuario }) {
  // 1) Si viene numérico, úsalo
  const numericId = toNumericId(IdUsuario);
  if (numericId !== null) {
    const result = await client.query(
      `SELECT idusuario
       FROM usuarios
       WHERE idusuario = $1
       LIMIT 1`,
      [numericId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].idusuario;
    }
  }

  // 2) Si no, intenta por nombre o usuario
  const nombre = normalizeText(NombreUsuario || IdUsuario);
  if (!nombre) {
    throw new Error("No se pudo resolver IdUsuario / NombreUsuario.");
  }

  const result = await client.query(
    `SELECT idusuario
     FROM usuarios
     WHERE LOWER(nombre) = LOWER($1)
        OR LOWER(usuario) = LOWER($1)
     ORDER BY idusuario ASC
     LIMIT 1`,
    [nombre]
  );

  if (result.rows.length === 0) {
    throw new Error(`No se encontró el usuario en la base de datos: ${nombre}`);
  }

  return result.rows[0].idusuario;
}

async function resolveBusinessUnitId(client, { IdBusinessUnit, NombreBusinessUnit }) {
  // 1) Si viene numérico, úsalo
  const numericId = toNumericId(IdBusinessUnit);
  if (numericId !== null) {
    const result = await client.query(
      `SELECT idbusinessunit
       FROM businessunit
       WHERE idbusinessunit = $1
       LIMIT 1`,
      [numericId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].idbusinessunit;
    }
  }

  // 2) Si no, busca por nombre
  const nombre = normalizeText(NombreBusinessUnit || IdBusinessUnit);
  if (!nombre) {
    throw new Error("No se pudo resolver IdBusinessUnit / NombreBusinessUnit.");
  }

  const result = await client.query(
    `SELECT idbusinessunit
     FROM businessunit
     WHERE LOWER(nombre) = LOWER($1)
     ORDER BY idbusinessunit ASC
     LIMIT 1`,
    [nombre]
  );

  if (result.rows.length === 0) {
    throw new Error(`No se encontró la Business Unit en la base de datos: ${nombre}`);
  }

  return result.rows[0].idbusinessunit;
}

async function resolveProductionLineId(client, {
  IdProductionLine,
  NombreProductionLine,
  idBusinessUnit
}) {
  // 1) Si viene numérico, úsalo
  const numericId = toNumericId(IdProductionLine);
  if (numericId !== null) {
    const result = await client.query(
      `SELECT idproductionline
       FROM productionline
       WHERE idproductionline = $1
       LIMIT 1`,
      [numericId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].idproductionline;
    }
  }

  // 2) Si no, busca por nombre y BU
  const nombre = normalizeText(NombreProductionLine || IdProductionLine);
  if (!nombre) {
    throw new Error("No se pudo resolver IdProductionLine / NombreProductionLine.");
  }

  let result;

  if (idBusinessUnit) {
    result = await client.query(
      `SELECT idproductionline
       FROM productionline
       WHERE LOWER(nombre) = LOWER($1)
         AND idbusinessunit = $2
       ORDER BY idproductionline ASC
       LIMIT 1`,
      [nombre, idBusinessUnit]
    );
  } else {
    result = await client.query(
      `SELECT idproductionline
       FROM productionline
       WHERE LOWER(nombre) = LOWER($1)
       ORDER BY idproductionline ASC
       LIMIT 1`,
      [nombre]
    );
  }

  if (result.rows.length === 0) {
    throw new Error(`No se encontró la Production Line en la base de datos: ${nombre}`);
  }

  return result.rows[0].idproductionline;
}

function sanitizeFechaReview(value) {
  const text = normalizeText(value);
  return text || null;
}

// ======================================================
// GUARDAR REVIEW (corregido)
// Acepta IDs numéricos O nombres enviados desde frontend
// ======================================================
router.post("/guardar", async (req, res) => {
  const client = await pool.connect();

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

    await client.query("BEGIN");

    // Resolver usuario
    const idUsuarioReal = await resolveUserId(client, {
      IdUsuario,
      NombreUsuario
    });

    // Resolver BU
    const idBusinessUnitReal = await resolveBusinessUnitId(client, {
      IdBusinessUnit,
      NombreBusinessUnit
    });

    // Resolver Production Line
    const idProductionLineReal = await resolveProductionLineId(client, {
      IdProductionLine,
      NombreProductionLine,
      idBusinessUnit: idBusinessUnitReal
    });

    const fechaReviewSanitizada = sanitizeFechaReview(FechaReview);

    // Insert review
    const reviewResult = await client.query(
      `INSERT INTO reviews (
         idusuario,
         idbusinessunit,
         idproductionline,
         fechareview
       )
       VALUES (
         $1,
         $2,
         $3,
         COALESCE($4::timestamp, NOW())
       )
       RETURNING idreview`,
      [
        idUsuarioReal,
        idBusinessUnitReal,
        idProductionLineReal,
        fechaReviewSanitizada
      ]
    );

    const idReview = reviewResult.rows[0].idreview;

    // Insert respuestas
    for (const r of respuestas) {
      const idPregunta = toNumericId(r.IdPregunta);
      const puntuacion = Number(r.Puntuacion);
      const comentario = r.Comentario ?? "";

      if (idPregunta === null) {
        throw new Error(`IdPregunta inválido: ${r.IdPregunta}`);
      }

      if (Number.isNaN(puntuacion)) {
        throw new Error(`Puntuacion inválida para la pregunta ${idPregunta}`);
      }

      await client.query(
        `INSERT INTO respuestas (
           idreview,
           idpregunta,
           puntuacion,
           comentario
         )
         VALUES ($1, $2, $3, $4)`,
        [idReview, idPregunta, puntuacion, comentario]
      );
    }

    await client.query("COMMIT");

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
    await client.query("ROLLBACK");

    console.error("ERROR EN /reviews/guardar:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Error interno del servidor al guardar la review."
    });
  } finally {
    client.release();
  }
});

// ======================================================
// OBTENER DETALLE DE UN REVIEW
// ======================================================
router.get("/detalle/:idreview", async (req, res) => {
  const { idreview } = req.params;

  const query = `
    SELECT
      r.idreview,
      r.fechareview,
      u.nombre AS usuario,
      b.nombre AS businessunit,
      p.nombre AS productionline,
      res.idpregunta,
      q.texto AS pregunta,
      res.puntuacion,
      res.comentario
    FROM respuestas res
    JOIN reviews r
      ON res.idreview = r.idreview
    JOIN usuarios u
      ON r.idusuario = u.idusuario
    JOIN businessunit b
      ON r.idbusinessunit = b.idbusinessunit
    JOIN productionline p
      ON r.idproductionline = p.idproductionline
    JOIN preguntas q
      ON res.idpregunta = q.idpregunta
    WHERE res.idreview = $1
    ORDER BY res.idpregunta ASC;
  `;

  try {
    const result = await pool.query(query, [idreview]);
    res.json(result.rows);
  } catch (err) {
    console.error("ERROR EN /reviews/detalle:", err);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});

// ======================================================
// OBTENER TODOS LOS REVIEWS CON SUS RESPUESTAS
// ======================================================
router.get("/todos", async (req, res) => {
  const query = `
    SELECT
      r.idreview,
      r.fechareview,
      u.nombre AS usuario,
      b.nombre AS businessunit,
      p.nombre AS productionline,
      res.idpregunta,
      q.texto AS pregunta,
      res.puntuacion,
      res.comentario
    FROM respuestas res
    JOIN reviews r
      ON res.idreview = r.idreview
    JOIN usuarios u
      ON r.idusuario = u.idusuario
    JOIN businessunit b
      ON r.idbusinessunit = b.idbusinessunit
    JOIN productionline p
      ON r.idproductionline = p.idproductionline
    JOIN preguntas q
      ON res.idpregunta = q.idpregunta
    ORDER BY r.fechareview ASC, r.idreview ASC, res.idpregunta ASC;
  `;

  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("ERROR EN /reviews/todos:", err);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});

// ======================================================
// LISTA DE REVIEWS (SIN RESPUESTAS, incluye fecha)
// ======================================================
router.get("/lista", async (req, res) => {
  const query = `
    SELECT
      r.idreview,
      r.fechareview,
      u.nombre AS usuario,
      b.nombre AS businessunit,
      p.nombre AS productionline
    FROM reviews r
    JOIN usuarios u
      ON r.idusuario = u.idusuario
    JOIN businessunit b
      ON r.idbusinessunit = b.idbusinessunit
    JOIN productionline p
      ON r.idproductionline = p.idproductionline
    ORDER BY r.fechareview ASC, r.idreview ASC;
  `;

  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("ERROR EN /reviews/lista:", err);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});

module.exports = router;
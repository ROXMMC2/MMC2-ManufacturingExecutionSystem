const express = require("express");
const router = express.Router();
const pool = require("../db");

// ======================================================
// GET MODULOS
// GET /api/modulos
// ======================================================
router.get("/modulos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        idmodulo,
        nombre
      FROM modulos
      ORDER BY idmodulo ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo módulos:", error);

    res.status(500).json({
      ok: false,
      error: "Error obteniendo módulos",
      detalle: error.message
    });
  }
});

// ======================================================
// GET PREGUNTAS
// GET /api/preguntas
// ======================================================
router.get("/preguntas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.idpregunta,
        p.idmodulo,
        m.nombre AS modulo,
        p.texto,
        p.orden
      FROM preguntas p
      INNER JOIN modulos m
        ON p.idmodulo = m.idmodulo
      ORDER BY 
        p.idmodulo ASC,
        p.orden ASC,
        p.idpregunta ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo preguntas:", error);

    res.status(500).json({
      ok: false,
      error: "Error obteniendo preguntas",
      detalle: error.message
    });
  }
});

// ======================================================
// POST PREGUNTA
// POST /api/preguntas
// Body esperado:
// {
//   "texto": "Nueva pregunta...",
//   "idmodulo": 1,
//   "orden": 1 opcional
// }
// ======================================================
router.post("/preguntas", async (req, res) => {
  const client = await pool.connect();

  try {
    const texto = String(req.body.texto || "").trim();
    const idmodulo = Number(req.body.idmodulo);

    const ordenBody =
      req.body.orden === null ||
      req.body.orden === undefined ||
      req.body.orden === ""
        ? null
        : Number(req.body.orden);

    if (!texto) {
      return res.status(400).json({
        ok: false,
        error: "El texto de la pregunta es obligatorio."
      });
    }

    if (!Number.isFinite(idmodulo) || idmodulo <= 0) {
      return res.status(400).json({
        ok: false,
        error: "El idmodulo es obligatorio y debe ser numérico."
      });
    }

    if (ordenBody !== null && (!Number.isFinite(ordenBody) || ordenBody <= 0)) {
      return res.status(400).json({
        ok: false,
        error: "El número de pregunta debe ser mayor o igual a 1."
      });
    }

    await client.query("BEGIN");

    // Validar que exista el módulo
    const moduloExiste = await client.query(
      `
      SELECT idmodulo
      FROM modulos
      WHERE idmodulo = $1
      LIMIT 1
      `,
      [idmodulo]
    );

    if (moduloExiste.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        ok: false,
        error: "El módulo seleccionado no existe."
      });
    }

    let ordenFinal = ordenBody;

    // Si no mandan orden, asigna el siguiente número disponible
    if (ordenFinal === null) {
      const maxOrdenResult = await client.query(
        `
        SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente_orden
        FROM preguntas
        WHERE idmodulo = $1
        `,
        [idmodulo]
      );

      ordenFinal = Number(maxOrdenResult.rows[0].siguiente_orden);
    } else {
      /*
        Si insertas una nueva pregunta en un número que ya existe,
        recorremos las demás hacia abajo.
        Ejemplo:
        existentes: 1, 2, 3
        nueva con orden 2
        resultado: nueva = 2, antigua 2 = 3, antigua 3 = 4
      */
      await client.query(
        `
        UPDATE preguntas
        SET orden = orden + 1
        WHERE idmodulo = $1
          AND orden >= $2
        `,
        [idmodulo, ordenFinal]
      );
    }

    const result = await client.query(
      `
      INSERT INTO preguntas (texto, idmodulo, orden)
      VALUES ($1, $2, $3)
      RETURNING idpregunta, texto, idmodulo, orden
      `,
      [texto, idmodulo, ordenFinal]
    );

    await client.query("COMMIT");

    res.status(201).json({
      ok: true,
      message: "Pregunta creada correctamente.",
      pregunta: result.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Error creando pregunta:", error);

    res.status(500).json({
      ok: false,
      error: "Error creando pregunta",
      detalle: error.message
    });
  } finally {
    client.release();
  }
});

// ======================================================
// PUT PREGUNTA CON INTERCAMBIO DE ORDEN
// PUT /api/preguntas/:id
// Body esperado:
// {
//   "texto": "Pregunta editada...",
//   "idmodulo": 1,
//   "orden": 2
// }
// ======================================================
router.put("/preguntas/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = Number(req.params.id);
    const texto = String(req.body.texto || "").trim();
    const idmodulo = Number(req.body.idmodulo);
    const ordenNuevo = Number(req.body.orden);

    if (!Number.isFinite(id) || id <= 0) {
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

    if (!Number.isFinite(idmodulo) || idmodulo <= 0) {
      return res.status(400).json({
        ok: false,
        error: "El idmodulo es obligatorio y debe ser numérico."
      });
    }

    if (!Number.isFinite(ordenNuevo) || ordenNuevo <= 0) {
      return res.status(400).json({
        ok: false,
        error: "El número de pregunta es obligatorio y debe ser mayor o igual a 1."
      });
    }

    await client.query("BEGIN");

    // Validar que exista la pregunta actual
    const preguntaActualResult = await client.query(
      `
      SELECT 
        idpregunta,
        texto,
        idmodulo,
        orden
      FROM preguntas
      WHERE idpregunta = $1
      LIMIT 1
      `,
      [id]
    );

    if (preguntaActualResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        ok: false,
        error: "La pregunta no existe."
      });
    }

    const preguntaActual = preguntaActualResult.rows[0];
    const moduloAnterior = Number(preguntaActual.idmodulo);
    const ordenAnterior = Number(preguntaActual.orden);

    // Validar que exista el módulo destino
    const moduloExiste = await client.query(
      `
      SELECT idmodulo
      FROM modulos
      WHERE idmodulo = $1
      LIMIT 1
      `,
      [idmodulo]
    );

    if (moduloExiste.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        ok: false,
        error: "El módulo seleccionado no existe."
      });
    }

    // Si no cambió módulo ni orden, solo actualiza texto
    if (moduloAnterior === idmodulo && ordenAnterior === ordenNuevo) {
      const result = await client.query(
        `
        UPDATE preguntas
        SET texto = $1
        WHERE idpregunta = $2
        RETURNING idpregunta, texto, idmodulo, orden
        `,
        [texto, id]
      );

      await client.query("COMMIT");

      return res.json({
        ok: true,
        message: "Pregunta actualizada correctamente.",
        pregunta: result.rows[0]
      });
    }

    // Buscar si ya existe otra pregunta con ese orden en el módulo destino
    const preguntaConEseOrdenResult = await client.query(
      `
      SELECT 
        idpregunta,
        orden,
        idmodulo
      FROM preguntas
      WHERE idmodulo = $1
        AND orden = $2
        AND idpregunta <> $3
      LIMIT 1
      `,
      [idmodulo, ordenNuevo, id]
    );

    const existeOtraPregunta = preguntaConEseOrdenResult.rows.length > 0;

    if (existeOtraPregunta) {
      const otraPregunta = preguntaConEseOrdenResult.rows[0];

      /*
        Número temporal para evitar choque si tienes UNIQUE(idmodulo, orden).
        Primero movemos la pregunta actual a un lugar temporal.
      */
      const ordenTemporal = -999999;

      await client.query(
        `
        UPDATE preguntas
        SET orden = $1
        WHERE idpregunta = $2
        `,
        [ordenTemporal, id]
      );

      /*
        Intercambio:
        - La otra pregunta toma el orden anterior.
        - La pregunta editada toma el orden nuevo.
      */
      await client.query(
        `
        UPDATE preguntas
        SET orden = $1
        WHERE idpregunta = $2
        `,
        [ordenAnterior, otraPregunta.idpregunta]
      );

      const result = await client.query(
        `
        UPDATE preguntas
        SET 
          texto = $1,
          idmodulo = $2,
          orden = $3
        WHERE idpregunta = $4
        RETURNING idpregunta, texto, idmodulo, orden
        `,
        [texto, idmodulo, ordenNuevo, id]
      );

      await client.query("COMMIT");

      return res.json({
        ok: true,
        message: "Pregunta actualizada correctamente con intercambio de número.",
        pregunta: result.rows[0]
      });
    }

    // Si no existe otra pregunta con ese orden, solo actualiza normal
    const result = await client.query(
      `
      UPDATE preguntas
      SET 
        texto = $1,
        idmodulo = $2,
        orden = $3
      WHERE idpregunta = $4
      RETURNING idpregunta, texto, idmodulo, orden
      `,
      [texto, idmodulo, ordenNuevo, id]
    );

    await client.query("COMMIT");

    res.json({
      ok: true,
      message: "Pregunta actualizada correctamente.",
      pregunta: result.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Error actualizando pregunta:", error);

    res.status(500).json({
      ok: false,
      error: "Error actualizando pregunta",
      detalle: error.message
    });
  } finally {
    client.release();
  }
});

// ======================================================
// DELETE PREGUNTA
// DELETE /api/preguntas/:id
// ======================================================
router.delete("/preguntas/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        error: "El ID de la pregunta no es válido."
      });
    }

    await client.query("BEGIN");

    // Validar que exista la pregunta
    const preguntaExiste = await client.query(
      `
      SELECT idpregunta, idmodulo, orden
      FROM preguntas
      WHERE idpregunta = $1
      LIMIT 1
      `,
      [id]
    );

    if (preguntaExiste.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        ok: false,
        error: "La pregunta no existe."
      });
    }

    const pregunta = preguntaExiste.rows[0];
    const idmodulo = Number(pregunta.idmodulo);
    const ordenEliminado = Number(pregunta.orden);

    await client.query(
      `
      DELETE FROM preguntas
      WHERE idpregunta = $1
      `,
      [id]
    );

    // Reacomodar los números después de eliminar
    await client.query(
      `
      UPDATE preguntas
      SET orden = orden - 1
      WHERE idmodulo = $1
        AND orden > $2
      `,
      [idmodulo, ordenEliminado]
    );

    await client.query("COMMIT");

    res.json({
      ok: true,
      message: "Pregunta eliminada correctamente."
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Error eliminando pregunta:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        ok: false,
        error: "No se puede eliminar la pregunta porque ya está relacionada con auditorías o respuestas."
      });
    }

    res.status(500).json({
      ok: false,
      error: "Error eliminando pregunta",
      detalle: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
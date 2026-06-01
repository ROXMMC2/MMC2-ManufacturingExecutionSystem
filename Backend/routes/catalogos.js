const express = require("express");
const router = express.Router();
const pool = require("../db");
// GET /api/business-units
router.get("/business-units", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        idbusinessunit,
        nombre
      FROM businessunit
      ORDER BY nombre ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo Business Units:", error);
    res.status(500).json({
      ok: false,
      error: "Error obteniendo Business Units"
    });
  }
});

// POST /api/business-units
router.post("/business-units", async (req, res) => {
  try {
    const nombre = String(req.body.nombre || "").trim();

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre de la Business Unit es obligatorio."
      });
    }

    const duplicated = await pool.query(
      `
      SELECT idbusinessunit
      FROM businessunit
      WHERE LOWER(nombre) = LOWER($1)
      LIMIT 1
      `,
      [nombre]
    );

    if (duplicated.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe una Business Unit con ese nombre."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO businessunit (nombre)
      VALUES ($1)
      RETURNING idbusinessunit, nombre
      `,
      [nombre]
    );

    res.status(201).json({
      ok: true,
      message: "Business Unit creada correctamente.",
      businessUnit: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error creando Business Unit:", error);
    res.status(500).json({
      ok: false,
      error: "Error creando Business Unit"
    });
  }
});

// PUT /api/business-units/:id
router.put("/business-units/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const nombre = String(req.body.nombre || "").trim();

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre de la Business Unit es obligatorio."
      });
    }

    const existe = await pool.query(
      `
      SELECT idbusinessunit
      FROM businessunit
      WHERE idbusinessunit = $1
      LIMIT 1
      `,
      [id]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Business Unit no existe."
      });
    }

    const duplicated = await pool.query(
      `
      SELECT idbusinessunit
      FROM businessunit
      WHERE LOWER(nombre) = LOWER($1)
        AND idbusinessunit <> $2
      LIMIT 1
      `,
      [nombre, id]
    );

    if (duplicated.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe otra Business Unit con ese nombre."
      });
    }

    const result = await pool.query(
      `
      UPDATE businessunit
      SET nombre = $1
      WHERE idbusinessunit = $2
      RETURNING idbusinessunit, nombre
      `,
      [nombre, id]
    );

    res.json({
      ok: true,
      message: "Business Unit actualizada correctamente.",
      businessUnit: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error actualizando Business Unit:", error);
    res.status(500).json({
      ok: false,
      error: "Error actualizando Business Unit"
    });
  }
});

// DELETE /api/business-units/:id
router.delete("/business-units/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const related = await pool.query(
      `
      SELECT idproductionline
      FROM productionline
      WHERE idbusinessunit = $1
      LIMIT 1
      `,
      [id]
    );

    if (related.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "No puedes eliminar esta Business Unit porque tiene Production Lines asociadas."
      });
    }

    const result = await pool.query(
      `
      DELETE FROM businessunit
      WHERE idbusinessunit = $1
      RETURNING idbusinessunit
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Business Unit no existe."
      });
    }

    res.json({
      ok: true,
      message: "Business Unit eliminada correctamente."
    });
  } catch (error) {
    console.error("❌ Error eliminando Business Unit:", error);
    res.status(500).json({
      ok: false,
      error: "Error eliminando Business Unit"
    });
  }
});

// ======================================================
// PRODUCTION LINES
// ======================================================

// GET /api/production-lines
router.get("/production-lines", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.idproductionline,
        p.nombre,
        p.idbusinessunit,
        b.nombre AS businessunit
      FROM productionline p
      INNER JOIN businessunit b
        ON p.idbusinessunit = b.idbusinessunit
      ORDER BY b.idbusinessunit ASC, p.nombre ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo Production Lines:", error);
    res.status(500).json({
      ok: false,
      error: "Error obteniendo Production Lines"
    });
  }
});

// POST /api/production-lines
// POST /api/production-lines
router.post("/production-lines", async (req, res) => {
  try {
    const nombre = String(req.body.nombre || req.body.Nombre || "").trim();

    const idbusinessunitRaw =
      req.body.idbusinessunit ??
      req.body.idBusinessUnit ??
      req.body.businessUnitId ??
      req.body.IdBusinessUnit;

    const idbusinessunit = Number(idbusinessunitRaw);

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre de la Production Line es obligatorio."
      });
    }

    if (!Number.isFinite(idbusinessunit) || idbusinessunit <= 0) {
      return res.status(400).json({
        ok: false,
        error: "La Business Unit es obligatoria o no es válida."
      });
    }

    // Verificar que exista la BU
    const buExiste = await pool.query(
      `
      SELECT idbusinessunit
      FROM businessunit
      WHERE idbusinessunit = $1
      LIMIT 1
      `,
      [idbusinessunit]
    );

    if (buExiste.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Business Unit seleccionada no existe."
      });
    }

    // Validar duplicados dentro de la misma BU
    const duplicated = await pool.query(
      `
      SELECT idproductionline
      FROM productionline
      WHERE LOWER(nombre) = LOWER($1)
        AND idbusinessunit = $2
      LIMIT 1
      `,
      [nombre, idbusinessunit]
    );

    if (duplicated.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe una Production Line con ese nombre dentro de esa Business Unit."
      });
    }

    // Asegurar secuencia antes del insert
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('productionline', 'idproductionline'),
        COALESCE((SELECT MAX(idproductionline) FROM productionline), 1),
        true
      )
    `);

    const result = await pool.query(
      `
      INSERT INTO productionline (nombre, idbusinessunit)
      VALUES ($1, $2)
      RETURNING idproductionline, nombre, idbusinessunit
      `,
      [nombre, idbusinessunit]
    );

    res.status(201).json({
      ok: true,
      message: "Production Line creada correctamente.",
      productionLine: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error creando Production Line:", error);

    res.status(500).json({
      ok: false,
      error: "Error creando Production Line",
      detalle: error.message,
      codigo: error.code || null,
      constraint: error.constraint || null,
      detail: error.detail || null,
      table: error.table || null,
      column: error.column || null
    });
  }
});


// PUT /api/production-lines/:id
router.put("/production-lines/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const nombre = String(req.body.nombre || "").trim();
    const idbusinessunit = Number(req.body.idbusinessunit);

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre de la Production Line es obligatorio."
      });
    }

    if (Number.isNaN(idbusinessunit)) {
      return res.status(400).json({
        ok: false,
        error: "La Business Unit es obligatoria."
      });
    }

    const existe = await pool.query(
      `
      SELECT idproductionline
      FROM productionline
      WHERE idproductionline = $1
      LIMIT 1
      `,
      [id]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Production Line no existe."
      });
    }

    const buExiste = await pool.query(
      `
      SELECT idbusinessunit
      FROM businessunit
      WHERE idbusinessunit = $1
      LIMIT 1
      `,
      [idbusinessunit]
    );

    if (buExiste.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Business Unit seleccionada no existe."
      });
    }

    const duplicated = await pool.query(
      `
      SELECT idproductionline
      FROM productionline
      WHERE LOWER(nombre) = LOWER($1)
        AND idbusinessunit = $2
        AND idproductionline <> $3
      LIMIT 1
      `,
      [nombre, idbusinessunit, id]
    );

    if (duplicated.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe otra Production Line con ese nombre dentro de esa Business Unit."
      });
    }

    const result = await pool.query(
      `
      UPDATE productionline
      SET nombre = $1,
          idbusinessunit = $2
      WHERE idproductionline = $3
      RETURNING idproductionline, nombre, idbusinessunit
      `,
      [nombre, idbusinessunit, id]
    );

    res.json({
      ok: true,
      message: "Production Line actualizada correctamente.",
      productionLine: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error actualizando Production Line:", error);
    res.status(500).json({
      ok: false,
      error: "Error actualizando Production Line"
    });
  }
});

// DELETE /api/production-lines/:id
router.delete("/production-lines/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM productionline
      WHERE idproductionline = $1
      RETURNING idproductionline
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Production Line no existe."
      });
    }

    res.json({
      ok: true,
      message: "Production Line eliminada correctamente."
    });
  } catch (error) {
    console.error("❌ Error eliminando Production Line:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        ok: false,
        error: "No se puede eliminar la Production Line porque ya está relacionada con auditorías u otros registros."
      });
    }

    res.status(500).json({
      ok: false,
      error: "Error eliminando Production Line"
    });
  }
});

module.exports = router;


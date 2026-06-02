const express = require("express");
const router = express.Router();

const { sql, getPool } = require("../db");

// ======================================================
// GET /api/catalogos
// Devuelve Business Units y Production Lines juntas
// ======================================================
router.get("/catalogos", async (req, res) => {
  try {
    const pool = await getPool();

    const businessUnitsResult = await pool.request().query(`
      SELECT
        idbusinessunit,
        nombre
      FROM dbo.businessunit
      ORDER BY nombre ASC
    `);

    const productionLinesResult = await pool.request().query(`
      SELECT
        p.idproductionline,
        p.nombre,
        p.idbusinessunit,
        b.nombre AS businessunit
      FROM dbo.productionline p
      INNER JOIN dbo.businessunit b
        ON p.idbusinessunit = b.idbusinessunit
      ORDER BY b.idbusinessunit ASC, p.nombre ASC
    `);

    res.json({
      ok: true,
      businessUnits: businessUnitsResult.recordset,
      productionLines: productionLinesResult.recordset
    });
  } catch (error) {
    console.error("❌ Error obteniendo catálogos:", error);

    res.status(500).json({
      ok: false,
      error: "Error obteniendo catálogos",
      detalle: error.message
    });
  }
});

// ======================================================
// BUSINESS UNITS
// ======================================================

// GET /api/business-units
router.get("/business-units", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        idbusinessunit,
        nombre
      FROM dbo.businessunit
      ORDER BY nombre ASC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo Business Units:", error);

    res.status(500).json({
      ok: false,
      error: "Error obteniendo Business Units",
      detalle: error.message
    });
  }
});

// POST /api/business-units
router.post("/business-units", async (req, res) => {
  try {
    const nombre = String(req.body.nombre || req.body.Nombre || "").trim();

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre de la Business Unit es obligatorio."
      });
    }

    const pool = await getPool();

    const duplicated = await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .query(`
        SELECT TOP 1
          idbusinessunit
        FROM dbo.businessunit
        WHERE LOWER(nombre) = LOWER(@nombre)
      `);

    if (duplicated.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe una Business Unit con ese nombre."
      });
    }

    const result = await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .query(`
        INSERT INTO dbo.businessunit (nombre)
        OUTPUT
          INSERTED.idbusinessunit,
          INSERTED.nombre
        VALUES (@nombre)
      `);

    res.status(201).json({
      ok: true,
      message: "Business Unit creada correctamente.",
      businessUnit: result.recordset[0]
    });
  } catch (error) {
    console.error("❌ Error creando Business Unit:", error);

    res.status(500).json({
      ok: false,
      error: "Error creando Business Unit",
      detalle: error.message
    });
  }
});

// PUT /api/business-units/:id
router.put("/business-units/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nombre = String(req.body.nombre || req.body.Nombre || "").trim();

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        error: "ID de Business Unit inválido."
      });
    }

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre de la Business Unit es obligatorio."
      });
    }

    const pool = await getPool();

    const existe = await pool
      .request()
      .input("idbusinessunit", sql.Int, id)
      .query(`
        SELECT TOP 1
          idbusinessunit
        FROM dbo.businessunit
        WHERE idbusinessunit = @idbusinessunit
      `);

    if (existe.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Business Unit no existe."
      });
    }

    const duplicated = await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .input("idbusinessunit", sql.Int, id)
      .query(`
        SELECT TOP 1
          idbusinessunit
        FROM dbo.businessunit
        WHERE LOWER(nombre) = LOWER(@nombre)
          AND idbusinessunit <> @idbusinessunit
      `);

    if (duplicated.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe otra Business Unit con ese nombre."
      });
    }

    const result = await pool
      .request()
      .input("idbusinessunit", sql.Int, id)
      .input("nombre", sql.NVarChar(100), nombre)
      .query(`
        UPDATE dbo.businessunit
        SET nombre = @nombre
        OUTPUT
          INSERTED.idbusinessunit,
          INSERTED.nombre
        WHERE idbusinessunit = @idbusinessunit
      `);

    res.json({
      ok: true,
      message: "Business Unit actualizada correctamente.",
      businessUnit: result.recordset[0]
    });
  } catch (error) {
    console.error("❌ Error actualizando Business Unit:", error);

    res.status(500).json({
      ok: false,
      error: "Error actualizando Business Unit",
      detalle: error.message
    });
  }
});

// DELETE /api/business-units/:id
router.delete("/business-units/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        error: "ID de Business Unit inválido."
      });
    }

    const pool = await getPool();

    const related = await pool
      .request()
      .input("idbusinessunit", sql.Int, id)
      .query(`
        SELECT TOP 1
          idproductionline
        FROM dbo.productionline
        WHERE idbusinessunit = @idbusinessunit
      `);

    if (related.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "No puedes eliminar esta Business Unit porque tiene Production Lines asociadas."
      });
    }

    const result = await pool
      .request()
      .input("idbusinessunit", sql.Int, id)
      .query(`
        DELETE FROM dbo.businessunit
        OUTPUT DELETED.idbusinessunit
        WHERE idbusinessunit = @idbusinessunit
      `);

    if (result.recordset.length === 0) {
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
      error: "Error eliminando Business Unit",
      detalle: error.message
    });
  }
});

// ======================================================
// PRODUCTION LINES
// ======================================================

// GET /api/production-lines
router.get("/production-lines", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        p.idproductionline,
        p.nombre,
        p.idbusinessunit,
        b.nombre AS businessunit
      FROM dbo.productionline p
      INNER JOIN dbo.businessunit b
        ON p.idbusinessunit = b.idbusinessunit
      ORDER BY b.idbusinessunit ASC, p.nombre ASC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo Production Lines:", error);

    res.status(500).json({
      ok: false,
      error: "Error obteniendo Production Lines",
      detalle: error.message
    });
  }
});

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

    const pool = await getPool();

    const buExiste = await pool
      .request()
      .input("idbusinessunit", sql.Int, idbusinessunit)
      .query(`
        SELECT TOP 1
          idbusinessunit
        FROM dbo.businessunit
        WHERE idbusinessunit = @idbusinessunit
      `);

    if (buExiste.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Business Unit seleccionada no existe."
      });
    }

    const duplicated = await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .input("idbusinessunit", sql.Int, idbusinessunit)
      .query(`
        SELECT TOP 1
          idproductionline
        FROM dbo.productionline
        WHERE LOWER(nombre) = LOWER(@nombre)
          AND idbusinessunit = @idbusinessunit
      `);

    if (duplicated.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe una Production Line con ese nombre dentro de esa Business Unit."
      });
    }

    const result = await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .input("idbusinessunit", sql.Int, idbusinessunit)
      .query(`
        INSERT INTO dbo.productionline (
          nombre,
          idbusinessunit
        )
        OUTPUT
          INSERTED.idproductionline,
          INSERTED.nombre,
          INSERTED.idbusinessunit
        VALUES (
          @nombre,
          @idbusinessunit
        )
      `);

    res.status(201).json({
      ok: true,
      message: "Production Line creada correctamente.",
      productionLine: result.recordset[0]
    });
  } catch (error) {
    console.error("❌ Error creando Production Line:", error);

    res.status(500).json({
      ok: false,
      error: "Error creando Production Line",
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

// PUT /api/production-lines/:id
router.put("/production-lines/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nombre = String(req.body.nombre || req.body.Nombre || "").trim();

    const idbusinessunitRaw =
      req.body.idbusinessunit ??
      req.body.idBusinessUnit ??
      req.body.businessUnitId ??
      req.body.IdBusinessUnit;

    const idbusinessunit = Number(idbusinessunitRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        error: "ID de Production Line inválido."
      });
    }

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre de la Production Line es obligatorio."
      });
    }

    if (!Number.isFinite(idbusinessunit) || idbusinessunit <= 0) {
      return res.status(400).json({
        ok: false,
        error: "La Business Unit es obligatoria."
      });
    }

    const pool = await getPool();

    const existe = await pool
      .request()
      .input("idproductionline", sql.Int, id)
      .query(`
        SELECT TOP 1
          idproductionline
        FROM dbo.productionline
        WHERE idproductionline = @idproductionline
      `);

    if (existe.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Production Line no existe."
      });
    }

    const buExiste = await pool
      .request()
      .input("idbusinessunit", sql.Int, idbusinessunit)
      .query(`
        SELECT TOP 1
          idbusinessunit
        FROM dbo.businessunit
        WHERE idbusinessunit = @idbusinessunit
      `);

    if (buExiste.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "La Business Unit seleccionada no existe."
      });
    }

    const duplicated = await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .input("idbusinessunit", sql.Int, idbusinessunit)
      .input("idproductionline", sql.Int, id)
      .query(`
        SELECT TOP 1
          idproductionline
        FROM dbo.productionline
        WHERE LOWER(nombre) = LOWER(@nombre)
          AND idbusinessunit = @idbusinessunit
          AND idproductionline <> @idproductionline
      `);

    if (duplicated.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe otra Production Line con ese nombre dentro de esa Business Unit."
      });
    }

    const result = await pool
      .request()
      .input("idproductionline", sql.Int, id)
      .input("nombre", sql.NVarChar(100), nombre)
      .input("idbusinessunit", sql.Int, idbusinessunit)
      .query(`
        UPDATE dbo.productionline
        SET
          nombre = @nombre,
          idbusinessunit = @idbusinessunit
        OUTPUT
          INSERTED.idproductionline,
          INSERTED.nombre,
          INSERTED.idbusinessunit
        WHERE idproductionline = @idproductionline
      `);

    res.json({
      ok: true,
      message: "Production Line actualizada correctamente.",
      productionLine: result.recordset[0]
    });
  } catch (error) {
    console.error("❌ Error actualizando Production Line:", error);

    res.status(500).json({
      ok: false,
      error: "Error actualizando Production Line",
      detalle: error.message
    });
  }
});

// DELETE /api/production-lines/:id
router.delete("/production-lines/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        error: "ID de Production Line inválido."
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("idproductionline", sql.Int, id)
      .query(`
        DELETE FROM dbo.productionline
        OUTPUT DELETED.idproductionline
        WHERE idproductionline = @idproductionline
      `);

    if (result.recordset.length === 0) {
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

    if (error.number === 547) {
      return res.status(409).json({
        ok: false,
        error: "No se puede eliminar la Production Line porque ya está relacionada con auditorías u otros registros."
      });
    }

    res.status(500).json({
      ok: false,
      error: "Error eliminando Production Line",
      detalle: error.message
    });
  }
});

module.exports = router;
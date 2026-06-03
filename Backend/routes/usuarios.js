const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../db");

// ======================================================
// HELPERS
// ======================================================

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();

  if (
    role === "admin" ||
    role === "administrador" ||
    role === "administrator"
  ) {
    return "administrador";
  }

  if (
    role === "reviewer" ||
    role === "revisor"
  ) {
    return "reviewer";
  }

  if (
    role === "user" ||
    role === "usuario"
  ) {
    return "usuario";
  }

  return "reviewer";
}

function toInt(value) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return null;
  }

  return n;
}

// ======================================================
// GET /api/usuarios
// Obtener usuarios
// ======================================================

router.get("/usuarios", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        idusuario,
        nombre,
        usuario,
        contrasena,
        rol,
        activo,
        correo
      FROM dbo.usuarios
      ORDER BY idusuario ASC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo usuarios:", error);

    res.status(500).json({
      ok: false,
      error: "Error obteniendo usuarios",
      detalle: error.message,
      number: error.number || null,
      code: error.code || null,
      lineNumber: error.lineNumber || null
    });
  }
});

// ======================================================
// POST /api/usuarios
// Crear usuario
// ======================================================

router.post("/usuarios", async (req, res) => {
  try {
    const nombre = normalizeText(
      req.body.nombre ||
      req.body.Nombre ||
      req.body.name
    );

    const usuario = normalizeText(
      req.body.usuario ||
      req.body.Usuario ||
      req.body.username
    );

    const contrasena = normalizeText(
      req.body.contrasena ||
      req.body.Contrasena ||
      req.body.password
    );

    const correo = normalizeText(
      req.body.correo ||
      req.body.Correo ||
      req.body.email
    );

    const rol = normalizeRole(
      req.body.rol ||
      req.body.Rol ||
      req.body.role
    );

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre del usuario es obligatorio."
      });
    }

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        error: "El usuario para login es obligatorio."
      });
    }

    if (!contrasena) {
      return res.status(400).json({
        ok: false,
        error: "La contraseña es obligatoria."
      });
    }

    const pool = await getPool();

    // Validar usuario duplicado
    const duplicated = await pool
      .request()
      .input("usuario", sql.NVarChar(100), usuario)
      .query(`
        SELECT TOP 1
          idusuario
        FROM dbo.usuarios
        WHERE LOWER(usuario) = LOWER(@usuario)
      `);

    if (duplicated.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe un usuario con ese login."
      });
    }

    const result = await pool
      .request()
      .input("nombre", sql.NVarChar(150), nombre)
      .input("usuario", sql.NVarChar(100), usuario)
      .input("contrasena", sql.NVarChar(100), contrasena)
      .input("rol", sql.NVarChar(50), rol)
      .input("activo", sql.Bit, true)
      .input("correo", sql.NVarChar(150), correo || null)
      .query(`
        INSERT INTO dbo.usuarios (
          nombre,
          usuario,
          contrasena,
          rol,
          activo,
          correo
        )
        OUTPUT
          INSERTED.idusuario,
          INSERTED.nombre,
          INSERTED.usuario,
          INSERTED.contrasena,
          INSERTED.rol,
          INSERTED.activo,
          INSERTED.correo
        VALUES (
          @nombre,
          @usuario,
          @contrasena,
          @rol,
          @activo,
          @correo
        )
      `);

    res.status(201).json({
      ok: true,
      message: "Usuario creado correctamente.",
      usuario: result.recordset[0]
    });
  } catch (error) {
    console.error("❌ Error creando usuario:", error);

    res.status(500).json({
      ok: false,
      error: "Error creando usuario",
      detalle: error.message,
      number: error.number || null,
      code: error.code || null,
      lineNumber: error.lineNumber || null
    });
  }
});

// ======================================================
// PUT /api/usuarios/:id
// Actualizar usuario
// ======================================================

router.put("/usuarios/:id", async (req, res) => {
  try {
    const id = toInt(req.params.id);

    const nombre = normalizeText(
      req.body.nombre ||
      req.body.Nombre ||
      req.body.name
    );

    const usuario = normalizeText(
      req.body.usuario ||
      req.body.Usuario ||
      req.body.username
    );

    const contrasena = normalizeText(
      req.body.contrasena ||
      req.body.Contrasena ||
      req.body.password
    );

    const correo = normalizeText(
      req.body.correo ||
      req.body.Correo ||
      req.body.email
    );

    const rol = normalizeRole(
      req.body.rol ||
      req.body.Rol ||
      req.body.role
    );

    if (!id || id <= 0) {
      return res.status(400).json({
        ok: false,
        error: "ID de usuario inválido."
      });
    }

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        error: "El nombre del usuario es obligatorio."
      });
    }

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        error: "El usuario para login es obligatorio."
      });
    }

    const pool = await getPool();

    // Validar que el usuario exista
    const exists = await pool
      .request()
      .input("idusuario", sql.Int, id)
      .query(`
        SELECT TOP 1
          idusuario
        FROM dbo.usuarios
        WHERE idusuario = @idusuario
      `);

    if (exists.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "El usuario no existe."
      });
    }

    // Validar duplicado con otro usuario
    const duplicated = await pool
      .request()
      .input("usuario", sql.NVarChar(100), usuario)
      .input("idusuario", sql.Int, id)
      .query(`
        SELECT TOP 1
          idusuario
        FROM dbo.usuarios
        WHERE LOWER(usuario) = LOWER(@usuario)
          AND idusuario <> @idusuario
      `);

    if (duplicated.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Ya existe otro usuario con ese login."
      });
    }

    let result;

    if (contrasena) {
      // Actualización CON contraseña
      result = await pool
        .request()
        .input("idusuario", sql.Int, id)
        .input("nombre", sql.NVarChar(150), nombre)
        .input("usuario", sql.NVarChar(100), usuario)
        .input("contrasena", sql.NVarChar(100), contrasena)
        .input("rol", sql.NVarChar(50), rol)
        .input("correo", sql.NVarChar(150), correo || null)
        .query(`
          UPDATE dbo.usuarios
          SET
            nombre = @nombre,
            usuario = @usuario,
            contrasena = @contrasena,
            rol = @rol,
            correo = @correo
          OUTPUT
            INSERTED.idusuario,
            INSERTED.nombre,
            INSERTED.usuario,
            INSERTED.contrasena,
            INSERTED.rol,
            INSERTED.activo,
            INSERTED.correo
          WHERE idusuario = @idusuario
        `);
    } else {
      // Actualización SIN contraseña
      result = await pool
        .request()
        .input("idusuario", sql.Int, id)
        .input("nombre", sql.NVarChar(150), nombre)
        .input("usuario", sql.NVarChar(100), usuario)
        .input("rol", sql.NVarChar(50), rol)
        .input("correo", sql.NVarChar(150), correo || null)
        .query(`
          UPDATE dbo.usuarios
          SET
            nombre = @nombre,
            usuario = @usuario,
            rol = @rol,
            correo = @correo
          OUTPUT
            INSERTED.idusuario,
            INSERTED.nombre,
            INSERTED.usuario,
            INSERTED.contrasena,
            INSERTED.rol,
            INSERTED.activo,
            INSERTED.correo
          WHERE idusuario = @idusuario
        `);
    }

    res.json({
      ok: true,
      message: "Usuario actualizado correctamente.",
      usuario: result.recordset[0]
    });
  } catch (error) {
    console.error("❌ Error actualizando usuario:", error);

    res.status(500).json({
      ok: false,
      error: "Error actualizando usuario",
      detalle: error.message,
      number: error.number || null,
      code: error.code || null,
      lineNumber: error.lineNumber || null
    });
  }
});

// ======================================================
// DELETE /api/usuarios/:id
// Eliminar usuario
// ======================================================

router.delete("/usuarios/:id", async (req, res) => {
  try {
    const id = toInt(req.params.id);

    if (!id || id <= 0) {
      return res.status(400).json({
        ok: false,
        error: "ID de usuario inválido."
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("idusuario", sql.Int, id)
      .query(`
        DELETE FROM dbo.usuarios
        OUTPUT DELETED.idusuario
        WHERE idusuario = @idusuario
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "El usuario no existe."
      });
    }

    res.json({
      ok: true,
      message: "Usuario eliminado correctamente."
    });
  } catch (error) {
    console.error("❌ Error eliminando usuario:", error);

    if (error.number === 547) {
      return res.status(409).json({
        ok: false,
        error: "No se puede eliminar el usuario porque tiene auditorías relacionadas."
      });
    }

    res.status(500).json({
      ok: false,
      error: "Error eliminando usuario",
      detalle: error.message,
      number: error.number || null,
      code: error.code || null,
      lineNumber: error.lineNumber || null
    });
  }
});

// ======================================================
// POST /api/login
// Login
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const usuario = normalizeText(
      req.body.usuario ||
      req.body.Usuario ||
      req.body.username
    );

    const contrasena = normalizeText(
      req.body.contrasena ||
      req.body.Contrasena ||
      req.body.password
    );

    if (!usuario || !contrasena) {
      return res.status(400).json({
        ok: false,
        error: "Usuario y contraseña son obligatorios."
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("usuario", sql.NVarChar(100), usuario)
      .input("contrasena", sql.NVarChar(100), contrasena)
      .query(`
        SELECT TOP 1
          idusuario,
          nombre,
          usuario,
          contrasena,
          rol,
          activo,
          correo
        FROM dbo.usuarios
        WHERE UPPER(usuario) = UPPER(@usuario)
          AND contrasena = @contrasena
          AND activo = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        ok: false,
        error: "Credenciales incorrectas."
      });
    }

    const user = result.recordset[0];

    res.json({
      ok: true,
      message: "Login correcto",
      usuario: {
        idusuario: user.idusuario,
        id: user.idusuario,
        nombre: user.nombre,
        usuario: user.usuario,
        username: user.usuario,
        rol: user.rol,
        correo: user.correo
      }
    });
  } catch (error) {
    console.error("❌ Error en login:", error);

    res.status(500).json({
      ok: false,
      error: "Error interno en login",
      detalle: error.message,
      number: error.number || null,
      code: error.code || null,
      lineNumber: error.lineNumber || null
    });
  }
});

module.exports = router;
  const express = require("express");
  const router = express.Router();

 const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPorUsername,
  actualizarUsuario,
  eliminarUsuario,
  loginUsuario,

  obtenerActionPlans,
  crearActionPlan,
  actualizarActionPlan,
  cerrarActionPlan,
  eliminarActionPlan
} = require("../queries");

  // ======================================================
  // HELPERS
  // ======================================================
  function pick(obj, ...keys) {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
    }
    return undefined;
  }

  // ======================================================
  // GET /api/usuarios
  // ======================================================
  router.get("/usuarios", async (req, res) => {
    try {
      const lista = await obtenerUsuarios();
      res.json(lista);
    } catch (err) {
      console.error("Error obteniendo usuarios:", err);
      res.status(500).json({
        ok: false,
        error: "Error obteniendo usuarios"
      });
    }
  });

  // ======================================================
  // POST /api/usuarios
  // ======================================================
    router.post("/usuarios", async (req, res) => {
      try {
        const nombre = pick(req.body, "nombre", "Nombre");
        const usuario = pick(req.body, "usuario", "Usuario");
        const contrasena = pick(req.body, "contrasena", "Contrasena", "password");
        const correo = pick(req.body, "correo", "Correo", "email");
        const rol = pick(req.body, "rol", "Rol");

        if (!nombre || !usuario || !contrasena || !rol) {
          return res.status(400).json({
            ok: false,
            error: "Faltan campos obligatorios: nombre, usuario, contrasena y rol."
          });
        }

        const rolNormalizado = String(rol).trim().toLowerCase();

        const existente = await obtenerUsuarioPorUsername(usuario);
        if (existente) {
          return res.status(409).json({
            ok: false,
            error: "Ya existe un usuario con ese nombre de usuario."
          });
        }

        const nuevo = await crearUsuario({
          nombre,
          usuario,
          contrasena,
          correo,
          rol: rolNormalizado
        });

        res.status(201).json({
          ok: true,
          message: "Usuario creado correctamente",
          usuario: nuevo
        });
      } catch (err) {
      console.error("❌ Error creando usuario:", err);

      res.status(500).json({
        ok: false,
        error: "Error creando usuario",
        detalle: err.message,
        codigo: err.code || null,
        constraint: err.constraint || null,
        detail: err.detail || null,
        table: err.table || null,
        column: err.column || null
      });
    }
    });

  // ======================================================
  // PUT /api/usuarios/:id
  // ======================================================
  router.put("/usuarios/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const nombre = pick(req.body, "nombre", "Nombre");
      const usuario = pick(req.body, "usuario", "Usuario");
      const contrasena = pick(req.body, "contrasena", "Contrasena", "password");
      const correo = pick(req.body, "correo", "Correo", "email");
      const rol = pick(req.body, "rol", "Rol");

      if (!nombre || !usuario || !rol) {
        return res.status(400).json({
          ok: false,
          error: "Faltan campos obligatorios: nombre, usuario y rol."
        });
      }

      const actual = await obtenerUsuarioPorId(id);
      if (!actual) {
        return res.status(404).json({
          ok: false,
          error: "Usuario no encontrado."
        });
      }

      const existente = await obtenerUsuarioPorUsername(usuario);
      if (existente && String(existente.idusuario) !== String(id)) {
        return res.status(409).json({
          ok: false,
          error: "Ya existe otro usuario con ese nombre de usuario."
        });
      }

      const actualizado = await actualizarUsuario(id, {
        nombre,
        usuario,
        contrasena,
        correo,
        rol
      });

      res.json({
        ok: true,
        message: "Usuario actualizado correctamente",
        usuario: actualizado
      });
    } catch (err) {
      console.error("Error actualizando usuario:", err);
      res.status(500).json({
        ok: false,
        error: "Error actualizando usuario"
      });
    }
  });

  // ======================================================
  // DELETE /api/usuarios/:id
  // ======================================================
  router.delete("/usuarios/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const eliminado = await eliminarUsuario(id);

      if (!eliminado) {
        return res.status(404).json({
          ok: false,
          error: "Usuario no encontrado."
        });
      }

      res.json({
        ok: true,
        message: "Usuario eliminado correctamente"
      });
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      res.status(500).json({
        ok: false,
        error: "Error eliminando usuario"
      });
    }
  });

  // ======================================================
  // POST /api/login
  // ======================================================
  router.post("/login", async (req, res) => {
    try {
      const usuario = pick(req.body, "usuario", "Usuario");
      const contrasena = pick(req.body, "contrasena", "Contrasena", "password");

      if (!usuario || !contrasena) {
        return res.status(400).json({
          ok: false,
          error: "Faltan credenciales."
        });
      }

      const user = await loginUsuario(usuario, contrasena);

      if (!user) {
        return res.status(401).json({
          ok: false,
          error: "Credenciales incorrectas"
        });
      }

      res.json({
        ok: true,
        mensaje: "Login exitoso",
        usuario: user
      });
    } catch (err) {
      console.error("❌ Error en login:", err);

      res.status(500).json({
        ok: false,
        error: "Error en login",
        detalle: err.message,
        codigo: err.code || null,
        constraint: err.constraint || null,
        detail: err.detail || null,
        table: err.table || null,
        column: err.column || null
      });
    }
  });

  // ======================================================
// GET /api/action-plans
// ======================================================
router.get("/action-plans", async (req, res) => {
  try {
    const planes = await obtenerActionPlans();

    res.json(planes);
  } catch (err) {
    console.error("❌ Error obteniendo action plans:", err);

    res.status(500).json({
      ok: false,
      error: "Error obteniendo planes de acción",
      detalle: err.message
    });
  }
});

// ======================================================
// POST /api/action-plans
// ======================================================
router.post("/action-plans", async (req, res) => {
  try {
    const nuevo = await crearActionPlan(req.body);

    res.status(201).json({
      ok: true,
      message: "Plan de acción creado correctamente",
      plan: nuevo
    });
  } catch (err) {
    console.error("❌ Error creando action plan:", err);

    res.status(500).json({
      ok: false,
      error: "Error creando plan de acción",
      detalle: err.message
    });
  }
});

// ======================================================
// PUT /api/action-plans/:id
// ======================================================
router.put("/action-plans/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const actualizado = await actualizarActionPlan(id, req.body);

    if (!actualizado) {
      return res.status(404).json({
        ok: false,
        error: "Plan de acción no encontrado"
      });
    }

    res.json({
      ok: true,
      message: "Plan de acción actualizado correctamente",
      plan: actualizado
    });
  } catch (err) {
    console.error("❌ Error actualizando action plan:", err);

    res.status(500).json({
      ok: false,
      error: "Error actualizando plan de acción",
      detalle: err.message
    });
  }
});

// ======================================================
// PATCH /api/action-plans/:id/cerrar
// ======================================================
router.patch("/action-plans/:id/cerrar", async (req, res) => {
  try {
    const { id } = req.params;

    const cerrado = await cerrarActionPlan(id);

    if (!cerrado) {
      return res.status(404).json({
        ok: false,
        error: "Plan de acción no encontrado"
      });
    }

    res.json({
      ok: true,
      message: "Plan de acción cerrado correctamente",
      plan: cerrado
    });
  } catch (err) {
    console.error("❌ Error cerrando action plan:", err);

    res.status(500).json({
      ok: false,
      error: "Error cerrando plan de acción",
      detalle: err.message
    });
  }
});

// ======================================================
// DELETE /api/action-plans/:id
// ======================================================
router.delete("/action-plans/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado = await eliminarActionPlan(id);

    if (!eliminado) {
      return res.status(404).json({
        ok: false,
        error: "Plan de acción no encontrado"
      });
    }

    res.json({
      ok: true,
      message: "Plan de acción eliminado correctamente"
    });
  } catch (err) {
    console.error("❌ Error eliminando action plan:", err);

    res.status(500).json({
      ok: false,
      error: "Error eliminando plan de acción",
      detalle: err.message
    });
  }
});

  module.exports = router;

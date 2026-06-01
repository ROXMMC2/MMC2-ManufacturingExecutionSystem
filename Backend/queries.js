const pool = require("./db");

// ======================================================
// HELPERS
// ======================================================
function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return undefined;
}

// ======================================================
// CREAR USUARIO
// ======================================================
async function crearUsuario(data) {
  try {
    const nombre = pick(data, "nombre", "Nombre");
    const usuario = pick(data, "usuario", "Usuario");
    const contrasena = pick(data, "contrasena", "Contrasena", "password");
    const correo = pick(data, "correo", "Correo", "email");
    const rol = String(pick(data, "rol", "Rol") || "").trim().toLowerCase();

    const query = `
      INSERT INTO usuarios (nombre, usuario, contrasena, correo, rol, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING idusuario, nombre, usuario, contrasena, correo, rol, activo
    `;

    const values = [nombre, usuario, contrasena, correo || "", rol, true];

    console.log("📤 INSERT usuarios values:", values);

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error real en crearUsuario:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    });
    throw error;
  }
}

// ======================================================
// OBTENER TODOS LOS USUARIOS
// ======================================================
async function obtenerUsuarios() {
  const query = `
    SELECT
      idusuario,
      nombre,
      usuario,
      contrasena,
      correo,
      rol
    FROM usuarios
    ORDER BY idusuario ASC
  `;

  const result = await pool.query(query);
  return result.rows;
}

// ======================================================
// OBTENER USUARIO POR ID
// ======================================================
async function obtenerUsuarioPorId(id) {
  const query = `
    SELECT
      idusuario,
      nombre,
      usuario,
      contrasena,
      correo,
      rol,
      activo
    FROM usuarios
    WHERE idusuario = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// ======================================================
// OBTENER USUARIO POR USERNAME
// ======================================================
async function obtenerUsuarioPorUsername(usuario) {
  const query = `
    SELECT
      idusuario,
      nombre,
      usuario,
      contrasena,
      correo,
      rol,
      activo
    FROM usuarios
    WHERE LOWER(usuario) = LOWER($1)
    LIMIT 1
  `;

  const result = await pool.query(query, [usuario]);
  return result.rows[0] || null;
}

// ======================================================
// ACTUALIZAR USUARIO
// ======================================================
async function actualizarUsuario(id, data) {
  const actual = await obtenerUsuarioPorId(id);
  if (!actual) return null;

  const nombre = pick(data, "nombre", "Nombre") ?? actual.nombre;
  const usuario = pick(data, "usuario", "Usuario") ?? actual.usuario;
  const contrasena = pick(data, "contrasena", "Contrasena", "password");
  const correo = pick(data, "correo", "Correo", "email");
  const rol = String(pick(data, "rol", "Rol") ?? actual.rol).trim().toLowerCase();

  const passwordFinal =
    contrasena !== undefined && String(contrasena).trim() !== ""
      ? contrasena
      : actual.contrasena;

  const correoFinal =
    correo !== undefined
      ? correo
      : actual.correo;

  const query = `
    UPDATE usuarios
    SET
      nombre = $1,
      usuario = $2,
      contrasena = $3,
      correo = $4,
      rol = $5
    WHERE idusuario = $6
    RETURNING idusuario, nombre, usuario, contrasena, correo, rol, activo
  `;

  const values = [
    nombre,
    usuario,
    passwordFinal,
    correoFinal || "",
    rol,
    id
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// ======================================================
// ELIMINAR USUARIO
// ======================================================
async function eliminarUsuario(id) {
  const query = `
    DELETE FROM usuarios
    WHERE idusuario = $1
    RETURNING idusuario
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// ======================================================
// LOGIN
// ======================================================
async function loginUsuario(usuario, contrasena) {
  try {
    const query = `
      SELECT
        idusuario AS id,
        nombre,
        usuario,
        contrasena,
        correo,
        rol,
        activo
      FROM usuarios
      WHERE LOWER(usuario) = LOWER($1)
        AND contrasena = $2
      LIMIT 1
    `;

    const result = await pool.query(query, [usuario, contrasena]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error real en loginUsuario:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    });
    throw error;
  }
}

// ======================================================
// PREGUNTAS - OBTENER TODAS
// ======================================================
async function obtenerPreguntas() {
  const query = `
    SELECT
      p.idpregunta,
      p.texto,
      p.idmodulo,
      p.orden,
      m.nombre AS modulo
    FROM preguntas p
    LEFT JOIN modulos m ON m.idmodulo = p.idmodulo
    ORDER BY p.idmodulo ASC, p.orden ASC, p.idpregunta ASC
  `;

  const result = await pool.query(query);
  return result.rows;
}

// ======================================================
// PREGUNTAS - OBTENER POR ID
// ======================================================
async function obtenerPreguntaPorId(idpregunta) {
  const query = `
    SELECT
      idpregunta,
      texto,
      idmodulo,
      orden
    FROM preguntas
    WHERE idpregunta = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [idpregunta]);
  return result.rows[0] || null;
}

// ======================================================
// PREGUNTAS - NORMALIZAR ORDEN DE UN MÓDULO
// Deja orden como 1, 2, 3, 4... sin huecos
// ======================================================
async function normalizarOrdenPreguntasModulo(client, idmodulo) {
  const result = await client.query(
    `
    SELECT idpregunta
    FROM preguntas
    WHERE idmodulo = $1
    ORDER BY orden ASC, idpregunta ASC
    `,
    [idmodulo]
  );

  for (let i = 0; i < result.rows.length; i++) {
    const nuevoOrden = i + 1;
    const idpregunta = result.rows[i].idpregunta;

    await client.query(
      `
      UPDATE preguntas
      SET orden = $1
      WHERE idpregunta = $2
      `,
      [nuevoOrden, idpregunta]
    );
  }
}

// ======================================================
// PREGUNTAS - CREAR CON REORDEN AUTOMÁTICO
// ======================================================
async function crearPregunta(data) {
  const texto = pick(data, "texto", "text", "pregunta");
  const idmodulo = Number(pick(data, "idmodulo", "idModulo", "moduleId"));
  let orden = Number(pick(data, "orden", "order", "numeroPregunta"));

  if (!texto || !idmodulo) {
    throw new Error("Faltan campos obligatorios: texto e idmodulo.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await normalizarOrdenPreguntasModulo(client, idmodulo);

    const totalResult = await client.query(
      `
      SELECT COUNT(*)::int AS total
      FROM preguntas
      WHERE idmodulo = $1
      `,
      [idmodulo]
    );

    const total = totalResult.rows[0].total;

    if (!orden || orden < 1) {
      orden = total + 1;
    }

    if (orden > total + 1) {
      orden = total + 1;
    }

    await client.query(
      `
      UPDATE preguntas
      SET orden = orden + 1
      WHERE idmodulo = $1
        AND orden >= $2
      `,
      [idmodulo, orden]
    );

    const insertResult = await client.query(
      `
      INSERT INTO preguntas (
        texto,
        idmodulo,
        orden
      )
      VALUES ($1, $2, $3)
      RETURNING
        idpregunta,
        texto,
        idmodulo,
        orden
      `,
      [texto, idmodulo, orden]
    );

    await normalizarOrdenPreguntasModulo(client, idmodulo);

    await client.query("COMMIT");

    return insertResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creando pregunta con reorden:", error);
    throw error;
  } finally {
    client.release();
  }
}

// ======================================================
// PREGUNTAS - ACTUALIZAR CON REORDEN AUTOMÁTICO
// Mantiene idpregunta fijo
// ======================================================
async function actualizarPregunta(idpregunta, data) {
  const actual = await obtenerPreguntaPorId(idpregunta);

  if (!actual) return null;

  const texto =
    pick(data, "texto", "text", "pregunta") ?? actual.texto;

  const nuevoModulo =
    Number(pick(data, "idmodulo", "idModulo", "moduleId") ?? actual.idmodulo);

  let nuevoOrden =
    Number(pick(data, "orden", "order", "numeroPregunta") ?? actual.orden);

  const moduloAnterior = Number(actual.idmodulo);
  const ordenAnterior = Number(actual.orden);

  if (!texto || !nuevoModulo) {
    throw new Error("Faltan campos obligatorios: texto e idmodulo.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await normalizarOrdenPreguntasModulo(client, moduloAnterior);

    if (moduloAnterior !== nuevoModulo) {
      await normalizarOrdenPreguntasModulo(client, nuevoModulo);
    }

    const totalNuevoModuloResult = await client.query(
      `
      SELECT COUNT(*)::int AS total
      FROM preguntas
      WHERE idmodulo = $1
        AND idpregunta <> $2
      `,
      [nuevoModulo, idpregunta]
    );

    const totalNuevoModulo = totalNuevoModuloResult.rows[0].total;

    if (!nuevoOrden || nuevoOrden < 1) {
      nuevoOrden = totalNuevoModulo + 1;
    }

    if (nuevoOrden > totalNuevoModulo + 1) {
      nuevoOrden = totalNuevoModulo + 1;
    }

    // ======================================================
    // CASO 1: MISMO MÓDULO
    // ======================================================
    if (moduloAnterior === nuevoModulo) {
      if (nuevoOrden < ordenAnterior) {
        await client.query(
          `
          UPDATE preguntas
          SET orden = orden + 1
          WHERE idmodulo = $1
            AND orden >= $2
            AND orden < $3
            AND idpregunta <> $4
          `,
          [nuevoModulo, nuevoOrden, ordenAnterior, idpregunta]
        );
      } else if (nuevoOrden > ordenAnterior) {
        await client.query(
          `
          UPDATE preguntas
          SET orden = orden - 1
          WHERE idmodulo = $1
            AND orden > $2
            AND orden <= $3
            AND idpregunta <> $4
          `,
          [nuevoModulo, ordenAnterior, nuevoOrden, idpregunta]
        );
      }

      const updateResult = await client.query(
        `
        UPDATE preguntas
        SET
          texto = $1,
          idmodulo = $2,
          orden = $3
        WHERE idpregunta = $4
        RETURNING
          idpregunta,
          texto,
          idmodulo,
          orden
        `,
        [texto, nuevoModulo, nuevoOrden, idpregunta]
      );

      await normalizarOrdenPreguntasModulo(client, nuevoModulo);

      await client.query("COMMIT");

      return updateResult.rows[0];
    }

    // ======================================================
    // CASO 2: CAMBIA DE MÓDULO
    // ======================================================

    await client.query(
      `
      UPDATE preguntas
      SET orden = orden - 1
      WHERE idmodulo = $1
        AND orden > $2
      `,
      [moduloAnterior, ordenAnterior]
    );

    await client.query(
      `
      UPDATE preguntas
      SET orden = orden + 1
      WHERE idmodulo = $1
        AND orden >= $2
      `,
      [nuevoModulo, nuevoOrden]
    );

    const updateResult = await client.query(
      `
      UPDATE preguntas
      SET
        texto = $1,
        idmodulo = $2,
        orden = $3
      WHERE idpregunta = $4
      RETURNING
        idpregunta,
        texto,
        idmodulo,
        orden
      `,
      [texto, nuevoModulo, nuevoOrden, idpregunta]
    );

    await normalizarOrdenPreguntasModulo(client, moduloAnterior);
    await normalizarOrdenPreguntasModulo(client, nuevoModulo);

    await client.query("COMMIT");

    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error actualizando pregunta con reorden:", error);
    throw error;
  } finally {
    client.release();
  }
}

// ======================================================
// PREGUNTAS - ELIMINAR Y REORDENAR
// ======================================================
async function eliminarPregunta(idpregunta) {
  const actual = await obtenerPreguntaPorId(idpregunta);

  if (!actual) return null;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eliminadoResult = await client.query(
      `
      DELETE FROM preguntas
      WHERE idpregunta = $1
      RETURNING
        idpregunta,
        idmodulo,
        orden
      `,
      [idpregunta]
    );

    await normalizarOrdenPreguntasModulo(client, actual.idmodulo);

    await client.query("COMMIT");

    return eliminadoResult.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error eliminando pregunta:", error);
    throw error;
  } finally {
    client.release();
  }
}

// ======================================================
// HELPERS ACTION PLANS
// ======================================================
function calcularEstadoActionPlan(fechaCompromiso, fechaCierre, estadoManual = "ABIERTO") {
  if (fechaCierre) {
    return "CERRADO";
  }

  if (fechaCompromiso) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const compromiso = new Date(fechaCompromiso);
    compromiso.setHours(0, 0, 0, 0);

    if (hoy > compromiso) {
      return "VENCIDO";
    }
  }

  return estadoManual || "ABIERTO";
}

// ======================================================
// OBTENER PLANES DE ACCIÓN
// ======================================================
async function obtenerActionPlans() {
  const query = `
    SELECT
      id_action_plan AS id,
      fecha,
      id_usuario AS "creadoPorId",
      creado_por AS "creadoPor",
      id_business_unit AS "idBusinessUnit",
      business_unit AS "businessUnit",
      id_production_line AS "idProductionLine",
      production_line AS "productionLine",
      id_modulo AS "idModulo",
      modulo,
      id_pregunta AS "idPregunta",
      pregunta,
      accion_requerida AS "accionRequerida",
      responsable,
      fecha_compromiso AS "fechaCompromiso",
      fecha_cierre AS "fechaCierre",
      estado,
      creado_en AS "creadoEn",
      actualizado_en AS "actualizadoEn"
    FROM action_plans
    ORDER BY fecha DESC, id_action_plan DESC
  `;

  const result = await pool.query(query);

  return result.rows.map(item => ({
    ...item,
    estado: calcularEstadoActionPlan(
      item.fechaCompromiso,
      item.fechaCierre,
      item.estado
    )
  }));
}

// ======================================================
// OBTENER PLAN DE ACCIÓN POR ID
// ======================================================
async function obtenerActionPlanPorId(id) {
  const query = `
    SELECT
      id_action_plan AS id,
      fecha,
      id_usuario AS "creadoPorId",
      creado_por AS "creadoPor",
      id_business_unit AS "idBusinessUnit",
      business_unit AS "businessUnit",
      id_production_line AS "idProductionLine",
      production_line AS "productionLine",
      id_modulo AS "idModulo",
      modulo,
      id_pregunta AS "idPregunta",
      pregunta,
      accion_requerida AS "accionRequerida",
      responsable,
      fecha_compromiso AS "fechaCompromiso",
      fecha_cierre AS "fechaCierre",
      estado,
      creado_en AS "creadoEn",
      actualizado_en AS "actualizadoEn"
    FROM action_plans
    WHERE id_action_plan = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// ======================================================
// CREAR PLAN DE ACCIÓN
// ======================================================
async function crearActionPlan(data) {
  const fecha = pick(data, "fecha", "Fecha");

  const creadoPorId = pick(data, "creadoPorId", "idUsuario", "IdUsuario", "id_usuario");
  const creadoPor = pick(data, "creadoPor", "creado_por", "createdBy") || "Usuario";

  const idBusinessUnit = pick(data, "idBusinessUnit", "IdBusinessUnit", "id_business_unit");
  const businessUnit = pick(data, "businessUnit", "BusinessUnit", "business_unit");

  const idProductionLine = pick(data, "idProductionLine", "IdProductionLine", "id_production_line");
  const productionLine = pick(data, "productionLine", "ProductionLine", "production_line");

  const idModulo = pick(data, "idModulo", "IdModulo", "id_modulo");
  const modulo = pick(data, "modulo", "Modulo");

  const idPregunta = pick(data, "idPregunta", "IdPregunta", "id_pregunta");
  const pregunta = pick(data, "pregunta", "Pregunta");

  const accionRequerida = pick(data, "accionRequerida", "accion_requerida", "accion");
  const responsable = pick(data, "responsable", "Responsable") || "";

  const fechaCompromiso = pick(data, "fechaCompromiso", "fecha_compromiso", "FechaCompromiso") || null;
  const fechaCierre = pick(data, "fechaCierre", "fecha_cierre", "FechaCierre") || null;

  const estado = calcularEstadoActionPlan(fechaCompromiso, fechaCierre, "ABIERTO");

  const query = `
    INSERT INTO action_plans (
      fecha,
      id_usuario,
      creado_por,
      id_business_unit,
      business_unit,
      id_production_line,
      production_line,
      id_modulo,
      modulo,
      id_pregunta,
      pregunta,
      accion_requerida,
      responsable,
      fecha_compromiso,
      fecha_cierre,
      estado
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16
    )
    RETURNING
      id_action_plan AS id,
      fecha,
      id_usuario AS "creadoPorId",
      creado_por AS "creadoPor",
      id_business_unit AS "idBusinessUnit",
      business_unit AS "businessUnit",
      id_production_line AS "idProductionLine",
      production_line AS "productionLine",
      id_modulo AS "idModulo",
      modulo,
      id_pregunta AS "idPregunta",
      pregunta,
      accion_requerida AS "accionRequerida",
      responsable,
      fecha_compromiso AS "fechaCompromiso",
      fecha_cierre AS "fechaCierre",
      estado
  `;

  const values = [
    fecha,
    creadoPorId || null,
    creadoPor,
    idBusinessUnit || null,
    businessUnit,
    idProductionLine || null,
    productionLine,
    idModulo,
    modulo,
    idPregunta,
    pregunta,
    accionRequerida,
    responsable,
    fechaCompromiso,
    fechaCierre,
    estado
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// ======================================================
// ACTUALIZAR PLAN DE ACCIÓN
// ======================================================
async function actualizarActionPlan(id, data) {
  const actual = await obtenerActionPlanPorId(id);
  if (!actual) return null;

  const fecha = pick(data, "fecha", "Fecha") || actual.fecha;

  const idBusinessUnit =
    pick(data, "idBusinessUnit", "IdBusinessUnit", "id_business_unit") || actual.idBusinessUnit;

  const businessUnit =
    pick(data, "businessUnit", "BusinessUnit", "business_unit") || actual.businessUnit;

  const idProductionLine =
    pick(data, "idProductionLine", "IdProductionLine", "id_production_line") || actual.idProductionLine;

  const productionLine =
    pick(data, "productionLine", "ProductionLine", "production_line") || actual.productionLine;

  const idModulo =
    pick(data, "idModulo", "IdModulo", "id_modulo") || actual.idModulo;

  const modulo =
    pick(data, "modulo", "Modulo") || actual.modulo;

  const idPregunta =
    pick(data, "idPregunta", "IdPregunta", "id_pregunta") || actual.idPregunta;

  const pregunta =
    pick(data, "pregunta", "Pregunta") || actual.pregunta;

  const accionRequerida =
    pick(data, "accionRequerida", "accion_requerida", "accion") || actual.accionRequerida;

  const responsable =
    pick(data, "responsable", "Responsable") ?? actual.responsable;

  const fechaCompromiso =
    pick(data, "fechaCompromiso", "fecha_compromiso", "FechaCompromiso") ?? actual.fechaCompromiso;

  const fechaCierre =
    pick(data, "fechaCierre", "fecha_cierre", "FechaCierre") ?? actual.fechaCierre;

  const estado = calcularEstadoActionPlan(
    fechaCompromiso,
    fechaCierre,
    actual.estado || "ABIERTO"
  );

  const query = `
    UPDATE action_plans
    SET
      fecha = $1,
      id_business_unit = $2,
      business_unit = $3,
      id_production_line = $4,
      production_line = $5,
      id_modulo = $6,
      modulo = $7,
      id_pregunta = $8,
      pregunta = $9,
      accion_requerida = $10,
      responsable = $11,
      fecha_compromiso = $12,
      fecha_cierre = $13,
      estado = $14,
      actualizado_en = CURRENT_TIMESTAMP
    WHERE id_action_plan = $15
    RETURNING
      id_action_plan AS id,
      fecha,
      id_usuario AS "creadoPorId",
      creado_por AS "creadoPor",
      id_business_unit AS "idBusinessUnit",
      business_unit AS "businessUnit",
      id_production_line AS "idProductionLine",
      production_line AS "productionLine",
      id_modulo AS "idModulo",
      modulo,
      id_pregunta AS "idPregunta",
      pregunta,
      accion_requerida AS "accionRequerida",
      responsable,
      fecha_compromiso AS "fechaCompromiso",
      fecha_cierre AS "fechaCierre",
      estado
  `;

  const values = [
    fecha,
    idBusinessUnit || null,
    businessUnit,
    idProductionLine || null,
    productionLine,
    idModulo,
    modulo,
    idPregunta,
    pregunta,
    accionRequerida,
    responsable || "",
    fechaCompromiso || null,
    fechaCierre || null,
    estado,
    id
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

// ======================================================
// CERRAR PLAN DE ACCIÓN
// ======================================================
async function cerrarActionPlan(id) {
  const query = `
    UPDATE action_plans
    SET
      fecha_cierre = CURRENT_DATE,
      estado = 'CERRADO',
      actualizado_en = CURRENT_TIMESTAMP
    WHERE id_action_plan = $1
    RETURNING
      id_action_plan AS id,
      fecha,
      id_usuario AS "creadoPorId",
      creado_por AS "creadoPor",
      id_business_unit AS "idBusinessUnit",
      business_unit AS "businessUnit",
      id_production_line AS "idProductionLine",
      production_line AS "productionLine",
      id_modulo AS "idModulo",
      modulo,
      id_pregunta AS "idPregunta",
      pregunta,
      accion_requerida AS "accionRequerida",
      responsable,
      fecha_compromiso AS "fechaCompromiso",
      fecha_cierre AS "fechaCierre",
      estado
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// ======================================================
// ELIMINAR PLAN DE ACCIÓN
// ======================================================
async function eliminarActionPlan(id) {
  const query = `
    DELETE FROM action_plans
    WHERE id_action_plan = $1
    RETURNING id_action_plan AS id
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPorUsername,
  actualizarUsuario,
  eliminarUsuario,
  loginUsuario,

  obtenerPreguntas,
  obtenerPreguntaPorId,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta,

  obtenerActionPlans,
  obtenerActionPlanPorId,
  crearActionPlan,
  actualizarActionPlan,
  cerrarActionPlan,
  eliminarActionPlan
};
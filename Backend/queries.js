const { sql, getPool } = require("./db");

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

function toNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return value;
}

function toIntOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
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

    const pool = await getPool();

    const result = await pool
      .request()
      .input("nombre", sql.NVarChar(sql.MAX), nombre)
      .input("usuario", sql.NVarChar(sql.MAX), usuario)
      .input("contrasena", sql.NVarChar(sql.MAX), contrasena)
      .input("correo", sql.NVarChar(sql.MAX), correo || "")
      .input("rol", sql.NVarChar(sql.MAX), rol)
      .input("activo", sql.Bit, true)
      .query(`
        INSERT INTO usuarios (
          nombre,
          usuario,
          contrasena,
          correo,
          rol,
          activo
        )
        OUTPUT
          INSERTED.idusuario,
          INSERTED.nombre,
          INSERTED.usuario,
          INSERTED.contrasena,
          INSERTED.correo,
          INSERTED.rol,
          INSERTED.activo
        VALUES (
          @nombre,
          @usuario,
          @contrasena,
          @correo,
          @rol,
          @activo
        )
      `);

    return result.recordset[0];
  } catch (error) {
    console.error("❌ Error real en crearUsuario:", {
      message: error.message,
      code: error.code,
      number: error.number,
      state: error.state,
      class: error.class,
      serverName: error.serverName,
      procName: error.procName,
      lineNumber: error.lineNumber
    });

    throw error;
  }
}

// ======================================================
// OBTENER TODOS LOS USUARIOS
// ======================================================
async function obtenerUsuarios() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      idusuario,
      nombre,
      usuario,
      contrasena,
      correo,
      rol
    FROM usuarios
    ORDER BY idusuario ASC
  `);

  return result.recordset;
}

// ======================================================
// OBTENER USUARIO POR ID
// ======================================================
async function obtenerUsuarioPorId(id) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("idusuario", sql.Int, Number(id))
    .query(`
      SELECT TOP 1
        idusuario,
        nombre,
        usuario,
        contrasena,
        correo,
        rol,
        activo
      FROM usuarios
      WHERE idusuario = @idusuario
    `);

  return result.recordset[0] || null;
}

// ======================================================
// OBTENER USUARIO POR USERNAME
// ======================================================
async function obtenerUsuarioPorUsername(usuario) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("usuario", sql.NVarChar(sql.MAX), usuario)
    .query(`
      SELECT TOP 1
        idusuario,
        nombre,
        usuario,
        contrasena,
        correo,
        rol,
        activo
      FROM usuarios
      WHERE LOWER(usuario) = LOWER(@usuario)
    `);

  return result.recordset[0] || null;
}

// ======================================================
// ACTUALIZAR USUARIO
// ======================================================
async function actualizarUsuario(id, data) {
  const actual = await obtenerUsuarioPorId(id);

  if (!actual) {
    return null;
  }

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

  const pool = await getPool();

  const result = await pool
    .request()
    .input("idusuario", sql.Int, Number(id))
    .input("nombre", sql.NVarChar(sql.MAX), nombre)
    .input("usuario", sql.NVarChar(sql.MAX), usuario)
    .input("contrasena", sql.NVarChar(sql.MAX), passwordFinal)
    .input("correo", sql.NVarChar(sql.MAX), correoFinal || "")
    .input("rol", sql.NVarChar(sql.MAX), rol)
    .query(`
      UPDATE usuarios
      SET
        nombre = @nombre,
        usuario = @usuario,
        contrasena = @contrasena,
        correo = @correo,
        rol = @rol
      OUTPUT
        INSERTED.idusuario,
        INSERTED.nombre,
        INSERTED.usuario,
        INSERTED.contrasena,
        INSERTED.correo,
        INSERTED.rol,
        INSERTED.activo
      WHERE idusuario = @idusuario
    `);

  return result.recordset[0] || null;
}

// ======================================================
// ELIMINAR USUARIO
// ======================================================
async function eliminarUsuario(id) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("idusuario", sql.Int, Number(id))
    .query(`
      DELETE FROM usuarios
      OUTPUT DELETED.idusuario
      WHERE idusuario = @idusuario
    `);

  return result.recordset[0] || null;
}

// ======================================================
// LOGIN
// ======================================================
async function loginUsuario(usuario, contrasena) {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("usuario", sql.NVarChar(sql.MAX), usuario)
      .input("contrasena", sql.NVarChar(sql.MAX), contrasena)
      .query(`
        SELECT TOP 1
          idusuario AS id,
          nombre,
          usuario,
          contrasena,
          correo,
          rol,
          activo
        FROM usuarios
        WHERE LOWER(usuario) = LOWER(@usuario)
          AND contrasena = @contrasena
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("❌ Error real en loginUsuario:", {
      message: error.message,
      code: error.code,
      number: error.number,
      state: error.state,
      class: error.class,
      serverName: error.serverName,
      procName: error.procName,
      lineNumber: error.lineNumber
    });

    throw error;
  }
}

// ======================================================
// PREGUNTAS - OBTENER TODAS
// ======================================================
async function obtenerPreguntas() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      p.idpregunta,
      p.texto,
      p.idmodulo,
      p.orden,
      m.nombre AS modulo
    FROM preguntas p
    LEFT JOIN modulos m ON m.idmodulo = p.idmodulo
    ORDER BY p.idmodulo ASC, p.orden ASC, p.idpregunta ASC
  `);

  return result.recordset;
}

// ======================================================
// PREGUNTAS - OBTENER POR ID
// ======================================================
async function obtenerPreguntaPorId(idpregunta) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("idpregunta", sql.Int, Number(idpregunta))
    .query(`
      SELECT TOP 1
        idpregunta,
        texto,
        idmodulo,
        orden
      FROM preguntas
      WHERE idpregunta = @idpregunta
    `);

  return result.recordset[0] || null;
}

// ======================================================
// PREGUNTAS - NORMALIZAR ORDEN DE UN MÓDULO
// ======================================================
async function normalizarOrdenPreguntasModulo(transaction, idmodulo) {
  const selectRequest = new sql.Request(transaction);

  const result = await selectRequest
    .input("idmodulo", sql.Int, Number(idmodulo))
    .query(`
      SELECT idpregunta
      FROM preguntas
      WHERE idmodulo = @idmodulo
      ORDER BY orden ASC, idpregunta ASC
    `);

  for (let i = 0; i < result.recordset.length; i++) {
    const nuevoOrden = i + 1;
    const idpregunta = result.recordset[i].idpregunta;

    const updateRequest = new sql.Request(transaction);

    await updateRequest
      .input("orden", sql.Int, nuevoOrden)
      .input("idpregunta", sql.Int, Number(idpregunta))
      .query(`
        UPDATE preguntas
        SET orden = @orden
        WHERE idpregunta = @idpregunta
      `);
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

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await normalizarOrdenPreguntasModulo(transaction, idmodulo);

    const totalRequest = new sql.Request(transaction);

    const totalResult = await totalRequest
      .input("idmodulo", sql.Int, idmodulo)
      .query(`
        SELECT CAST(COUNT(*) AS INT) AS total
        FROM preguntas
        WHERE idmodulo = @idmodulo
      `);

    const total = totalResult.recordset[0].total;

    if (!orden || orden < 1) {
      orden = total + 1;
    }

    if (orden > total + 1) {
      orden = total + 1;
    }

    const shiftRequest = new sql.Request(transaction);

    await shiftRequest
      .input("idmodulo", sql.Int, idmodulo)
      .input("orden", sql.Int, orden)
      .query(`
        UPDATE preguntas
        SET orden = orden + 1
        WHERE idmodulo = @idmodulo
          AND orden >= @orden
      `);

    const insertRequest = new sql.Request(transaction);

    const insertResult = await insertRequest
      .input("texto", sql.NVarChar(sql.MAX), texto)
      .input("idmodulo", sql.Int, idmodulo)
      .input("orden", sql.Int, orden)
      .query(`
        INSERT INTO preguntas (
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

    await normalizarOrdenPreguntasModulo(transaction, idmodulo);

    await transaction.commit();

    return insertResult.recordset[0];
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creando pregunta con reorden:", error);
    throw error;
  }
}

// ======================================================
// PREGUNTAS - ACTUALIZAR CON REORDEN AUTOMÁTICO
// ======================================================
async function actualizarPregunta(idpregunta, data) {
  const actual = await obtenerPreguntaPorId(idpregunta);

  if (!actual) {
    return null;
  }

  const texto = pick(data, "texto", "text", "pregunta") ?? actual.texto;

  const nuevoModulo = Number(
    pick(data, "idmodulo", "idModulo", "moduleId") ?? actual.idmodulo
  );

  let nuevoOrden = Number(
    pick(data, "orden", "order", "numeroPregunta") ?? actual.orden
  );

  const moduloAnterior = Number(actual.idmodulo);
  const ordenAnterior = Number(actual.orden);

  if (!texto || !nuevoModulo) {
    throw new Error("Faltan campos obligatorios: texto e idmodulo.");
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await normalizarOrdenPreguntasModulo(transaction, moduloAnterior);

    if (moduloAnterior !== nuevoModulo) {
      await normalizarOrdenPreguntasModulo(transaction, nuevoModulo);
    }

    const totalRequest = new sql.Request(transaction);

    const totalNuevoModuloResult = await totalRequest
      .input("nuevoModulo", sql.Int, nuevoModulo)
      .input("idpregunta", sql.Int, Number(idpregunta))
      .query(`
        SELECT CAST(COUNT(*) AS INT) AS total
        FROM preguntas
        WHERE idmodulo = @nuevoModulo
          AND idpregunta <> @idpregunta
      `);

    const totalNuevoModulo = totalNuevoModuloResult.recordset[0].total;

    if (!nuevoOrden || nuevoOrden < 1) {
      nuevoOrden = totalNuevoModulo + 1;
    }

    if (nuevoOrden > totalNuevoModulo + 1) {
      nuevoOrden = totalNuevoModulo + 1;
    }

    if (moduloAnterior === nuevoModulo) {
      if (nuevoOrden < ordenAnterior) {
        const request = new sql.Request(transaction);

        await request
          .input("nuevoModulo", sql.Int, nuevoModulo)
          .input("nuevoOrden", sql.Int, nuevoOrden)
          .input("ordenAnterior", sql.Int, ordenAnterior)
          .input("idpregunta", sql.Int, Number(idpregunta))
          .query(`
            UPDATE preguntas
            SET orden = orden + 1
            WHERE idmodulo = @nuevoModulo
              AND orden >= @nuevoOrden
              AND orden < @ordenAnterior
              AND idpregunta <> @idpregunta
          `);
      } else if (nuevoOrden > ordenAnterior) {
        const request = new sql.Request(transaction);

        await request
          .input("nuevoModulo", sql.Int, nuevoModulo)
          .input("ordenAnterior", sql.Int, ordenAnterior)
          .input("nuevoOrden", sql.Int, nuevoOrden)
          .input("idpregunta", sql.Int, Number(idpregunta))
          .query(`
            UPDATE preguntas
            SET orden = orden - 1
            WHERE idmodulo = @nuevoModulo
              AND orden > @ordenAnterior
              AND orden <= @nuevoOrden
              AND idpregunta <> @idpregunta
          `);
      }

      const updateRequest = new sql.Request(transaction);

      const updateResult = await updateRequest
        .input("texto", sql.NVarChar(sql.MAX), texto)
        .input("nuevoModulo", sql.Int, nuevoModulo)
        .input("nuevoOrden", sql.Int, nuevoOrden)
        .input("idpregunta", sql.Int, Number(idpregunta))
        .query(`
          UPDATE preguntas
          SET
            texto = @texto,
            idmodulo = @nuevoModulo,
            orden = @nuevoOrden
          OUTPUT
            INSERTED.idpregunta,
            INSERTED.texto,
            INSERTED.idmodulo,
            INSERTED.orden
          WHERE idpregunta = @idpregunta
        `);

      await normalizarOrdenPreguntasModulo(transaction, nuevoModulo);

      await transaction.commit();

      return updateResult.recordset[0];
    }

    const reduceOldModuleRequest = new sql.Request(transaction);

    await reduceOldModuleRequest
      .input("moduloAnterior", sql.Int, moduloAnterior)
      .input("ordenAnterior", sql.Int, ordenAnterior)
      .query(`
        UPDATE preguntas
        SET orden = orden - 1
        WHERE idmodulo = @moduloAnterior
          AND orden > @ordenAnterior
      `);

    const shiftNewModuleRequest = new sql.Request(transaction);

    await shiftNewModuleRequest
      .input("nuevoModulo", sql.Int, nuevoModulo)
      .input("nuevoOrden", sql.Int, nuevoOrden)
      .query(`
        UPDATE preguntas
        SET orden = orden + 1
        WHERE idmodulo = @nuevoModulo
          AND orden >= @nuevoOrden
      `);

    const updateRequest = new sql.Request(transaction);

    const updateResult = await updateRequest
      .input("texto", sql.NVarChar(sql.MAX), texto)
      .input("nuevoModulo", sql.Int, nuevoModulo)
      .input("nuevoOrden", sql.Int, nuevoOrden)
      .input("idpregunta", sql.Int, Number(idpregunta))
      .query(`
        UPDATE preguntas
        SET
          texto = @texto,
          idmodulo = @nuevoModulo,
          orden = @nuevoOrden
        OUTPUT
          INSERTED.idpregunta,
          INSERTED.texto,
          INSERTED.idmodulo,
          INSERTED.orden
        WHERE idpregunta = @idpregunta
      `);

    await normalizarOrdenPreguntasModulo(transaction, moduloAnterior);
    await normalizarOrdenPreguntasModulo(transaction, nuevoModulo);

    await transaction.commit();

    return updateResult.recordset[0];
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error actualizando pregunta con reorden:", error);
    throw error;
  }
}

// ======================================================
// PREGUNTAS - ELIMINAR Y REORDENAR
// ======================================================
async function eliminarPregunta(idpregunta) {
  const actual = await obtenerPreguntaPorId(idpregunta);

  if (!actual) {
    return null;
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const deleteRequest = new sql.Request(transaction);

    const eliminadoResult = await deleteRequest
      .input("idpregunta", sql.Int, Number(idpregunta))
      .query(`
        DELETE FROM preguntas
        OUTPUT
          DELETED.idpregunta,
          DELETED.idmodulo,
          DELETED.orden
        WHERE idpregunta = @idpregunta
      `);

    await normalizarOrdenPreguntasModulo(transaction, actual.idmodulo);

    await transaction.commit();

    return eliminadoResult.recordset[0] || null;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error eliminando pregunta:", error);
    throw error;
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
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      id_action_plan AS id,
      fecha,
      id_usuario AS creadoPorId,
      creado_por AS creadoPor,
      id_business_unit AS idBusinessUnit,
      business_unit AS businessUnit,
      id_production_line AS idProductionLine,
      production_line AS productionLine,
      id_modulo AS idModulo,
      modulo,
      id_pregunta AS idPregunta,
      pregunta,
      accion_requerida AS accionRequerida,
      responsable,
      fecha_compromiso AS fechaCompromiso,
      fecha_cierre AS fechaCierre,
      estado,
      creado_en AS creadoEn,
      actualizado_en AS actualizadoEn
    FROM action_plans
    ORDER BY fecha DESC, id_action_plan DESC
  `);

  return result.recordset.map(item => ({
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
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", sql.Int, Number(id))
    .query(`
      SELECT TOP 1
        id_action_plan AS id,
        fecha,
        id_usuario AS creadoPorId,
        creado_por AS creadoPor,
        id_business_unit AS idBusinessUnit,
        business_unit AS businessUnit,
        id_production_line AS idProductionLine,
        production_line AS productionLine,
        id_modulo AS idModulo,
        modulo,
        id_pregunta AS idPregunta,
        pregunta,
        accion_requerida AS accionRequerida,
        responsable,
        fecha_compromiso AS fechaCompromiso,
        fecha_cierre AS fechaCierre,
        estado,
        creado_en AS creadoEn,
        actualizado_en AS actualizadoEn
      FROM action_plans
      WHERE id_action_plan = @id
    `);

  return result.recordset[0] || null;
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

  const pool = await getPool();

  const result = await pool
    .request()
    .input("fecha", sql.Date, toNull(fecha))
    .input("creadoPorId", sql.Int, toIntOrNull(creadoPorId))
    .input("creadoPor", sql.NVarChar(sql.MAX), creadoPor)
    .input("idBusinessUnit", sql.Int, toIntOrNull(idBusinessUnit))
    .input("businessUnit", sql.NVarChar(sql.MAX), businessUnit)
    .input("idProductionLine", sql.Int, toIntOrNull(idProductionLine))
    .input("productionLine", sql.NVarChar(sql.MAX), productionLine)
    .input("idModulo", sql.Int, toIntOrNull(idModulo))
    .input("modulo", sql.NVarChar(sql.MAX), modulo)
    .input("idPregunta", sql.Int, toIntOrNull(idPregunta))
    .input("pregunta", sql.NVarChar(sql.MAX), pregunta)
    .input("accionRequerida", sql.NVarChar(sql.MAX), accionRequerida)
    .input("responsable", sql.NVarChar(sql.MAX), responsable)
    .input("fechaCompromiso", sql.Date, toNull(fechaCompromiso))
    .input("fechaCierre", sql.Date, toNull(fechaCierre))
    .input("estado", sql.NVarChar(sql.MAX), estado)
    .query(`
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
      OUTPUT
        INSERTED.id_action_plan AS id,
        INSERTED.fecha,
        INSERTED.id_usuario AS creadoPorId,
        INSERTED.creado_por AS creadoPor,
        INSERTED.id_business_unit AS idBusinessUnit,
        INSERTED.business_unit AS businessUnit,
        INSERTED.id_production_line AS idProductionLine,
        INSERTED.production_line AS productionLine,
        INSERTED.id_modulo AS idModulo,
        INSERTED.modulo,
        INSERTED.id_pregunta AS idPregunta,
        INSERTED.pregunta,
        INSERTED.accion_requerida AS accionRequerida,
        INSERTED.responsable,
        INSERTED.fecha_compromiso AS fechaCompromiso,
        INSERTED.fecha_cierre AS fechaCierre,
        INSERTED.estado
      VALUES (
        @fecha,
        @creadoPorId,
        @creadoPor,
        @idBusinessUnit,
        @businessUnit,
        @idProductionLine,
        @productionLine,
        @idModulo,
        @modulo,
        @idPregunta,
        @pregunta,
        @accionRequerida,
        @responsable,
        @fechaCompromiso,
        @fechaCierre,
        @estado
      )
    `);

  return result.recordset[0];
}

// ======================================================
// ACTUALIZAR PLAN DE ACCIÓN
// ======================================================
async function actualizarActionPlan(id, data) {
  const actual = await obtenerActionPlanPorId(id);

  if (!actual) {
    return null;
  }

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

  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", sql.Int, Number(id))
    .input("fecha", sql.Date, toNull(fecha))
    .input("idBusinessUnit", sql.Int, toIntOrNull(idBusinessUnit))
    .input("businessUnit", sql.NVarChar(sql.MAX), businessUnit)
    .input("idProductionLine", sql.Int, toIntOrNull(idProductionLine))
    .input("productionLine", sql.NVarChar(sql.MAX), productionLine)
    .input("idModulo", sql.Int, toIntOrNull(idModulo))
    .input("modulo", sql.NVarChar(sql.MAX), modulo)
    .input("idPregunta", sql.Int, toIntOrNull(idPregunta))
    .input("pregunta", sql.NVarChar(sql.MAX), pregunta)
    .input("accionRequerida", sql.NVarChar(sql.MAX), accionRequerida)
    .input("responsable", sql.NVarChar(sql.MAX), responsable || "")
    .input("fechaCompromiso", sql.Date, toNull(fechaCompromiso))
    .input("fechaCierre", sql.Date, toNull(fechaCierre))
    .input("estado", sql.NVarChar(sql.MAX), estado)
    .query(`
      UPDATE action_plans
      SET
        fecha = @fecha,
        id_business_unit = @idBusinessUnit,
        business_unit = @businessUnit,
        id_production_line = @idProductionLine,
        production_line = @productionLine,
        id_modulo = @idModulo,
        modulo = @modulo,
        id_pregunta = @idPregunta,
        pregunta = @pregunta,
        accion_requerida = @accionRequerida,
        responsable = @responsable,
        fecha_compromiso = @fechaCompromiso,
        fecha_cierre = @fechaCierre,
        estado = @estado,
        actualizado_en = GETDATE()
      OUTPUT
        INSERTED.id_action_plan AS id,
        INSERTED.fecha,
        INSERTED.id_usuario AS creadoPorId,
        INSERTED.creado_por AS creadoPor,
        INSERTED.id_business_unit AS idBusinessUnit,
        INSERTED.business_unit AS businessUnit,
        INSERTED.id_production_line AS idProductionLine,
        INSERTED.production_line AS productionLine,
        INSERTED.id_modulo AS idModulo,
        INSERTED.modulo,
        INSERTED.id_pregunta AS idPregunta,
        INSERTED.pregunta,
        INSERTED.accion_requerida AS accionRequerida,
        INSERTED.responsable,
        INSERTED.fecha_compromiso AS fechaCompromiso,
        INSERTED.fecha_cierre AS fechaCierre,
        INSERTED.estado
      WHERE id_action_plan = @id
    `);

  return result.recordset[0] || null;
}

// ======================================================
// CERRAR PLAN DE ACCIÓN
// ======================================================
async function cerrarActionPlan(id) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", sql.Int, Number(id))
    .query(`
      UPDATE action_plans
      SET
        fecha_cierre = CAST(GETDATE() AS date),
        estado = 'CERRADO',
        actualizado_en = GETDATE()
      OUTPUT
        INSERTED.id_action_plan AS id,
        INSERTED.fecha,
        INSERTED.id_usuario AS creadoPorId,
        INSERTED.creado_por AS creadoPor,
        INSERTED.id_business_unit AS idBusinessUnit,
        INSERTED.business_unit AS businessUnit,
        INSERTED.id_production_line AS idProductionLine,
        INSERTED.production_line AS productionLine,
        INSERTED.id_modulo AS idModulo,
        INSERTED.modulo,
        INSERTED.id_pregunta AS idPregunta,
        INSERTED.pregunta,
        INSERTED.accion_requerida AS accionRequerida,
        INSERTED.responsable,
        INSERTED.fecha_compromiso AS fechaCompromiso,
        INSERTED.fecha_cierre AS fechaCierre,
        INSERTED.estado
      WHERE id_action_plan = @id
    `);

  return result.recordset[0] || null;
}

// ======================================================
// ELIMINAR PLAN DE ACCIÓN
// ======================================================
async function eliminarActionPlan(id) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", sql.Int, Number(id))
    .query(`
      DELETE FROM action_plans
      OUTPUT DELETED.id_action_plan AS id
      WHERE id_action_plan = @id
    `);

  return result.recordset[0] || null;
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
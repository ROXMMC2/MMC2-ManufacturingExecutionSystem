const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");
// ======================================================
// HELPERS
// ======================================================
function toIntOrNull(value) {
 if (value === null || value === undefined || value === "") return null;
 const n = Number(value);
 return Number.isNaN(n) ? null : n;
}
function toDateOrNull(value) {
 if (!value) return null;
 return value;
}
function toTextOrNull(value) {
 if (value === null || value === undefined) return null;
 const text = String(value).trim();
 return text === "" ? null : text;
}
function getDetalleError(error) {
 return {
   message: error.message || null,
   code: error.code || null,
   number: error.number || null,
   state: error.state || null,
   class: error.class || null,
   serverName: error.serverName || null,
   procName: error.procName || null,
   lineNumber: error.lineNumber || null
 };
}
// ======================================================
// GET /api/action-plans
// Obtener todos los planes de acción
// ======================================================
router.get("/", async (req, res) => {
 try {
   const pool = await poolPromise;
   const result = await pool.request().query(`
     SELECT
       id_action_plan AS id,
       id_action_plan AS idActionPlan,
       id_action_plan AS id_action_plan,
       fecha,
       id_usuario AS creadoPorId,
       id_usuario AS idUsuario,
       id_usuario AS id_usuario,
       creado_por AS creadoPor,
       creado_por AS creado_por,
       id_business_unit AS idBusinessUnit,
       id_business_unit AS id_business_unit,
       business_unit AS businessUnit,
       business_unit AS business_unit,
       id_production_line AS idProductionLine,
       id_production_line AS id_production_line,
       production_line AS productionLine,
       production_line AS production_line,
       id_modulo AS idModulo,
       id_modulo AS id_modulo,
       modulo,
       id_pregunta AS idPregunta,
       id_pregunta AS id_pregunta,
       pregunta,
       accion_requerida AS accionRequerida,
       accion_requerida AS accion_requerida,
       responsable,
       fecha_compromiso AS fechaCompromiso,
       fecha_compromiso AS fecha_compromiso,
       fecha_cierre AS fechaCierre,
       fecha_cierre AS fecha_cierre,
       estado,
       creado_en AS creadoEn,
       creado_en AS creado_en,
       actualizado_en AS actualizadoEn,
       actualizado_en AS actualizado_en
     FROM dbo.action_plans
     ORDER BY creado_en DESC, id_action_plan DESC;
   `);
   return res.json(result.recordset);
 } catch (error) {
   console.error("Error obteniendo action plans:", error);
   return res.status(500).json({
     ok: false,
     error: "Error obteniendo planes de acción",
     detalle: error.message,
     sql: getDetalleError(error)
   });
 }
});
// ======================================================
// POST /api/action-plans
// Crear plan de acción
// ======================================================
router.post("/", async (req, res) => {
 try {
   const {
     fecha,
     creadoPor,
     creadoPorId,
     idBusinessUnit,
     businessUnit,
     idProductionLine,
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
   } = req.body;
   if (!fecha || !businessUnit || !productionLine || !idModulo || !idPregunta) {
     return res.status(400).json({
       ok: false,
       error: "Faltan campos obligatorios",
       detalle: "Fecha, Business Unit, Production Line, Módulo y Pregunta son obligatorios."
     });
   }
   if (!accionRequerida) return res.status(400).json({ ok: false, error: "Falta acción requerida" });
   if (!responsable) return res.status(400).json({ ok: false, error: "Falta responsable" });
   if (!fechaCompromiso) return res.status(400).json({ ok: false, error: "Falta fecha compromiso" });
   const pool = await poolPromise;
   const result = await pool.request()
     .input("fecha", sql.Date, toDateOrNull(fecha))
     .input("id_usuario", sql.Int, toIntOrNull(creadoPorId))
     .input("creado_por", sql.NVarChar(sql.MAX), toTextOrNull(creadoPor))
     .input("id_business_unit", sql.Int, toIntOrNull(idBusinessUnit))
     .input("business_unit", sql.NVarChar(sql.MAX), toTextOrNull(businessUnit))
     .input("id_production_line", sql.Int, toIntOrNull(idProductionLine))
     .input("production_line", sql.NVarChar(sql.MAX), toTextOrNull(productionLine))
     .input("id_modulo", sql.Int, toIntOrNull(idModulo))
     .input("modulo", sql.NVarChar(sql.MAX), toTextOrNull(modulo))
     .input("id_pregunta", sql.Int, toIntOrNull(idPregunta))
     .input("pregunta", sql.NVarChar(sql.MAX), toTextOrNull(pregunta))
     .input("accion_requerida", sql.NVarChar(sql.MAX), toTextOrNull(accionRequerida))
     .input("responsable", sql.NVarChar(sql.MAX), toTextOrNull(responsable))
     .input("fecha_compromiso", sql.Date, toDateOrNull(fechaCompromiso))
     .input("fecha_cierre", sql.Date, toDateOrNull(fechaCierre))
     .input("estado", sql.NVarChar(sql.MAX), toTextOrNull(estado) || "ABIERTO")
     .query(`
       INSERT INTO dbo.action_plans (
         fecha, id_usuario, creado_por, id_business_unit, business_unit,
         id_production_line, production_line, id_modulo, modulo, id_pregunta,
         pregunta, accion_requerida, responsable, fecha_compromiso, fecha_cierre, estado
       )
       OUTPUT
         INSERTED.id_action_plan AS id,
         INSERTED.id_action_plan AS idActionPlan,
         INSERTED.id_action_plan AS id_action_plan,
         INSERTED.fecha,
         INSERTED.id_usuario AS creadoPorId,
         INSERTED.id_usuario AS idUsuario,
         INSERTED.id_usuario AS id_usuario,
         INSERTED.creado_por AS creadoPor,
         INSERTED.creado_por AS creado_por,
         INSERTED.id_business_unit AS idBusinessUnit,
         INSERTED.id_business_unit AS id_business_unit,
         INSERTED.business_unit AS businessUnit,
         INSERTED.business_unit AS business_unit,
         INSERTED.id_production_line AS idProductionLine,
         INSERTED.id_production_line AS id_production_line,
         INSERTED.production_line AS productionLine,
         INSERTED.production_line AS production_line,
         INSERTED.id_modulo AS idModulo,
         INSERTED.id_modulo AS id_modulo,
         INSERTED.modulo,
         INSERTED.id_pregunta AS idPregunta,
         INSERTED.id_pregunta AS id_pregunta,
         INSERTED.pregunta,
         INSERTED.accion_requerida AS accionRequerida,
         INSERTED.accion_requerida AS accion_requerida,
         INSERTED.responsable,
         INSERTED.fecha_compromiso AS fechaCompromiso,
         INSERTED.fecha_compromiso AS fecha_compromiso,
         INSERTED.fecha_cierre AS fechaCierre,
         INSERTED.fecha_cierre AS fecha_cierre,
         INSERTED.estado,
         INSERTED.creado_en AS creadoEn,
         INSERTED.creado_en AS creado_en,
         INSERTED.actualizado_en AS actualizadoEn,
         INSERTED.actualizado_en AS actualizado_en
       VALUES (
         @fecha, @id_usuario, @creado_por, @id_business_unit, @business_unit,
         @id_production_line, @production_line, @id_modulo, @modulo, @id_pregunta,
         @pregunta, @accion_requerida, @responsable, @fecha_compromiso, @fecha_cierre, @estado
       );
     `);
   return res.status(201).json({
     ok: true,
     message: "Plan de acción creado correctamente",
     data: result.recordset[0]
   });
 } catch (error) {
   console.error("Error creando action plan:", error);
   return res.status(500).json({
     ok: false,
     error: "Error creando plan de acción",
     detalle: error.message,
     sql: getDetalleError(error)
   });
 }
});
// ======================================================
// PUT /api/action-plans/:id
// Actualizar plan de acción
// ======================================================
router.put("/:id", async (req, res) => {
 try {
   const { id } = req.params;
   if (!id || Number.isNaN(Number(id))) {
     return res.status(400).json({ ok: false, error: "ID inválido" });
   }
   const {
     fecha,
     creadoPor,
     creadoPorId,
     idBusinessUnit,
     businessUnit,
     idProductionLine,
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
   } = req.body;
   const pool = await poolPromise;
   const result = await pool.request()
     .input("id_action_plan", sql.Int, Number(id))
     .input("fecha", sql.Date, toDateOrNull(fecha))
     .input("id_usuario", sql.Int, toIntOrNull(creadoPorId))
     .input("creado_por", sql.NVarChar(sql.MAX), toTextOrNull(creadoPor))
     .input("id_business_unit", sql.Int, toIntOrNull(idBusinessUnit))
     .input("business_unit", sql.NVarChar(sql.MAX), toTextOrNull(businessUnit))
     .input("id_production_line", sql.Int, toIntOrNull(idProductionLine))
     .input("production_line", sql.NVarChar(sql.MAX), toTextOrNull(productionLine))
     .input("id_modulo", sql.Int, toIntOrNull(idModulo))
     .input("modulo", sql.NVarChar(sql.MAX), toTextOrNull(modulo))
     .input("id_pregunta", sql.Int, toIntOrNull(idPregunta))
     .input("pregunta", sql.NVarChar(sql.MAX), toTextOrNull(pregunta))
     .input("accion_requerida", sql.NVarChar(sql.MAX), toTextOrNull(accionRequerida))
     .input("responsable", sql.NVarChar(sql.MAX), toTextOrNull(responsable))
     .input("fecha_compromiso", sql.Date, toDateOrNull(fechaCompromiso))
     .input("fecha_cierre", sql.Date, toDateOrNull(fechaCierre))
     .input("estado", sql.NVarChar(sql.MAX), toTextOrNull(estado) || "ABIERTO")
     .query(`
       UPDATE dbo.action_plans
       SET
         fecha = @fecha,
         id_usuario = @id_usuario,
         creado_por = @creado_por,
         id_business_unit = @id_business_unit,
         business_unit = @business_unit,
         id_production_line = @id_production_line,
         production_line = @production_line,
         id_modulo = @id_modulo,
         modulo = @modulo,
         id_pregunta = @id_pregunta,
         pregunta = @pregunta,
         accion_requerida = @accion_requerida,
         responsable = @responsable,
         fecha_compromiso = @fecha_compromiso,
         fecha_cierre = @fecha_cierre,
         estado = @estado,
         actualizado_en = SYSDATETIME()
       OUTPUT
         INSERTED.id_action_plan AS id,
         INSERTED.id_action_plan AS idActionPlan,
         INSERTED.id_action_plan AS id_action_plan,
         INSERTED.fecha,
         INSERTED.id_usuario AS creadoPorId,
         INSERTED.id_usuario AS idUsuario,
         INSERTED.id_usuario AS id_usuario,
         INSERTED.creado_por AS creadoPor,
         INSERTED.creado_por AS creado_por,
         INSERTED.id_business_unit AS idBusinessUnit,
         INSERTED.id_business_unit AS id_business_unit,
         INSERTED.business_unit AS businessUnit,
         INSERTED.business_unit AS business_unit,
         INSERTED.id_production_line AS idProductionLine,
         INSERTED.id_production_line AS id_production_line,
         INSERTED.production_line AS productionLine,
         INSERTED.production_line AS production_line,
         INSERTED.id_modulo AS idModulo,
         INSERTED.id_modulo AS id_modulo,
         INSERTED.modulo,
         INSERTED.id_pregunta AS idPregunta,
         INSERTED.id_pregunta AS id_pregunta,
         INSERTED.pregunta,
         INSERTED.accion_requerida AS accionRequerida,
         INSERTED.accion_requerida AS accion_requerida,
         INSERTED.responsable,
         INSERTED.fecha_compromiso AS fechaCompromiso,
         INSERTED.fecha_compromiso AS fecha_compromiso,
         INSERTED.fecha_cierre AS fechaCierre,
         INSERTED.fecha_cierre AS fecha_cierre,
         INSERTED.estado,
         INSERTED.creado_en AS creadoEn,
         INSERTED.creado_en AS creado_en,
         INSERTED.actualizado_en AS actualizadoEn,
         INSERTED.actualizado_en AS actualizado_en
       WHERE id_action_plan = @id_action_plan;
     `);
   if (!result.recordset.length) {
     return res.status(404).json({ ok: false, error: "Plan de acción no encontrado" });
   }
   return res.json({
     ok: true,
     message: "Plan de acción actualizado correctamente",
     data: result.recordset[0]
   });
 } catch (error) {
   console.error("Error actualizando action plan:", error);
   return res.status(500).json({
     ok: false,
     error: "Error actualizando plan de acción",
     detalle: error.message,
     sql: getDetalleError(error)
   });
 }
});
// ======================================================
// PATCH /api/action-plans/:id/cerrar
// Cerrar acción
// ======================================================
router.patch("/:id/cerrar", async (req, res) => {
 try {
   const { id } = req.params;
   if (!id || Number.isNaN(Number(id))) {
     return res.status(400).json({ ok: false, error: "ID inválido" });
   }
   const pool = await poolPromise;
   const result = await pool.request()
     .input("id_action_plan", sql.Int, Number(id))
     .query(`
       UPDATE dbo.action_plans
       SET
         fecha_cierre = CAST(GETDATE() AS DATE),
         estado = 'CERRADO',
         actualizado_en = SYSDATETIME()
       OUTPUT
         INSERTED.id_action_plan AS id,
         INSERTED.id_action_plan AS idActionPlan,
         INSERTED.id_action_plan AS id_action_plan,
         INSERTED.fecha,
         INSERTED.id_usuario AS creadoPorId,
         INSERTED.id_usuario AS idUsuario,
         INSERTED.id_usuario AS id_usuario,
         INSERTED.creado_por AS creadoPor,
         INSERTED.creado_por AS creado_por,
         INSERTED.id_business_unit AS idBusinessUnit,
         INSERTED.id_business_unit AS id_business_unit,
         INSERTED.business_unit AS businessUnit,
         INSERTED.business_unit AS business_unit,
         INSERTED.id_production_line AS idProductionLine,
         INSERTED.id_production_line AS id_production_line,
         INSERTED.production_line AS productionLine,
         INSERTED.production_line AS production_line,
         INSERTED.id_modulo AS idModulo,
         INSERTED.id_modulo AS id_modulo,
         INSERTED.modulo,
         INSERTED.id_pregunta AS idPregunta,
         INSERTED.id_pregunta AS id_pregunta,
         INSERTED.pregunta,
         INSERTED.accion_requerida AS accionRequerida,
         INSERTED.accion_requerida AS accion_requerida,
         INSERTED.responsable,
         INSERTED.fecha_compromiso AS fechaCompromiso,
         INSERTED.fecha_compromiso AS fecha_compromiso,
         INSERTED.fecha_cierre AS fechaCierre,
         INSERTED.fecha_cierre AS fecha_cierre,
         INSERTED.estado,
         INSERTED.creado_en AS creadoEn,
         INSERTED.creado_en AS creado_en,
         INSERTED.actualizado_en AS actualizadoEn,
         INSERTED.actualizado_en AS actualizado_en
       WHERE id_action_plan = @id_action_plan;
     `);
   if (!result.recordset.length) {
     return res.status(404).json({ ok: false, error: "Plan de acción no encontrado" });
   }
   return res.json({
     ok: true,
     message: "Plan de acción cerrado correctamente",
     data: result.recordset[0]
   });
 } catch (error) {
   console.error("Error cerrando action plan:", error);
   return res.status(500).json({
     ok: false,
     error: "Error cerrando plan de acción",
     detalle: error.message,
     sql: getDetalleError(error)
   });
 }
});
// ======================================================
// DELETE /api/action-plans/:id
// Eliminar plan de acción
// ======================================================
router.delete("/:id", async (req, res) => {
 try {
   const { id } = req.params;
   if (!id || Number.isNaN(Number(id))) {
     return res.status(400).json({ ok: false, error: "ID inválido" });
   }
   const userRole = String(req.headers["x-user-role"] || "").toUpperCase();
   if (
     userRole !== "ADMIN" &&
     userRole !== "ADMINISTRADOR" &&
     userRole !== "ADMINISTRATOR"
   ) {
     return res.status(403).json({
       ok: false,
       error: "Solo un administrador puede eliminar planes de acción."
     });
   }
   const pool = await poolPromise;
   const result = await pool.request()
     .input("id_action_plan", sql.Int, Number(id))
     .query(`
       DELETE FROM dbo.action_plans
       OUTPUT
         DELETED.id_action_plan AS id,
         DELETED.id_action_plan AS idActionPlan,
         DELETED.id_action_plan AS id_action_plan,
         DELETED.fecha,
         DELETED.id_usuario AS creadoPorId,
         DELETED.id_usuario AS idUsuario,
         DELETED.id_usuario AS id_usuario,
         DELETED.creado_por AS creadoPor,
         DELETED.creado_por AS creado_por,
         DELETED.id_business_unit AS idBusinessUnit,
         DELETED.id_business_unit AS id_business_unit,
         DELETED.business_unit AS businessUnit,
         DELETED.business_unit AS business_unit,
         DELETED.id_production_line AS idProductionLine,
         DELETED.id_production_line AS id_production_line,
         DELETED.production_line AS productionLine,
         DELETED.production_line AS production_line,
         DELETED.id_modulo AS idModulo,
         DELETED.id_modulo AS id_modulo,
         DELETED.modulo,
         DELETED.id_pregunta AS idPregunta,
         DELETED.id_pregunta AS id_pregunta,
         DELETED.pregunta,
         DELETED.accion_requerida AS accionRequerida,
         DELETED.accion_requerida AS accion_requerida,
         DELETED.responsable,
         DELETED.fecha_compromiso AS fechaCompromiso,
         DELETED.fecha_compromiso AS fecha_compromiso,
         DELETED.fecha_cierre AS fechaCierre,
         DELETED.fecha_cierre AS fecha_cierre,
         DELETED.estado,
         DELETED.creado_en AS creadoEn,
         DELETED.creado_en AS creado_en,
         DELETED.actualizado_en AS actualizadoEn,
         DELETED.actualizado_en AS actualizado_en
       WHERE id_action_plan = @id_action_plan;
     `);
   if (!result.recordset.length) {
     return res.status(404).json({ ok: false, error: "Plan de acción no encontrado" });
   }
   return res.json({
     ok: true,
     message: "Plan de acción eliminado correctamente",
     data: result.recordset[0]
   });
 } catch (error) {
   console.error("Error eliminando action plan:", error);
   return res.status(500).json({
     ok: false,
     error: "Error eliminando plan de acción",
     detalle: error.message,
     sql: getDetalleError(error)
   });
 }
});
// Exportar el router al final del archivo
module.exports = router;
// ======================================================
// Este archivo va SOLO en Auditoria.html.
// Muestra el botón "Continuar progreso" si existe una review
// guardada en localStorage.
//
// NO toca Azure SQL.
// NO guarda en base de datos.
// NO modifica reviews reales.
// ======================================================
const STORAGE_KEY_REVIEW_EN_PROGRESO_AUDITORIA = "reviewEnProgresoActual";
// ======================================================
// OBTENER USUARIO ACTUAL Y LLAVES
// ======================================================
function getUsuarioSesionAuditoriaProgreso() {
 try {
   return (
     JSON.parse(localStorage.getItem("currentUser")) ||
     JSON.parse(localStorage.getItem("user")) ||
     null
   );
 } catch (error) {
   console.error("Error leyendo usuario de sesión:", error);
   return null;
 }
}
function getUsuarioKeyAuditoriaProgreso() {
 const user = getUsuarioSesionAuditoriaProgreso();
 if (!user) return "usuario_sin_sesion";
 return String(
user.id ||
   user.idUsuario ||
   user.idusuario ||
   user.IdUsuario ||
   user.username ||
   user.usuario ||
   user.user ||
   user.name ||
   user.nombre ||
   "usuario_sin_sesion"
 ).trim();
}
function getStorageKeyReviewEnProgresoAuditoria() {
 return `${STORAGE_KEY_REVIEW_EN_PROGRESO_AUDITORIA}_${getUsuarioKeyAuditoriaProgreso()}`;
}
// ======================================================
// BUSCAR REVIEW EN PROGRESO
// ======================================================
function obtenerReviewEnProgresoAuditoria() {
 try {
   // 1. Primero intenta buscar con el usuario actual
   const keyUsuarioActual = getStorageKeyReviewEnProgresoAuditoria();
   const rawUsuarioActual = localStorage.getItem(keyUsuarioActual);
   if (rawUsuarioActual) {
     const progresoUsuarioActual = JSON.parse(rawUsuarioActual);
     if (
       progresoUsuarioActual &&
       progresoUsuarioActual.enProgreso === true &&
       progresoUsuarioActual.ultimaPagina &&
       progresoUsuarioActual.ultimaPagina.hrefRelativo
     ) {
       console.log("Review en progreso encontrada:", keyUsuarioActual);
       return progresoUsuarioActual;
     }
   }
   // 2. Si no lo encuentra con el usuario actual,
   // busca cualquier progreso guardado que empiece con reviewEnProgresoActual_
   for (let i = 0; i < localStorage.length; i++) {
     const key = localStorage.key(i);
     if (!key) continue;
     if (!key.startsWith(`${STORAGE_KEY_REVIEW_EN_PROGRESO_AUDITORIA}_`)) {
       continue;
     }
     const raw = localStorage.getItem(key);
     if (!raw) continue;
     try {
       // CORRECCIÓN: Faltaba parsear el raw a JSON antes de usar 'progreso'
       const progreso = JSON.parse(raw);
       if (
         progreso &&
         progreso.enProgreso === true &&
         progreso.ultimaPagina &&
         progreso.ultimaPagina.hrefRelativo
       ) {
         console.log("Review en progreso encontrada por búsqueda general:", key);
         return progreso;
       }
     } catch (errorInterno) {
       console.warn("No se pudo leer esta llave de progreso:", key, errorInterno);
     }
   }
   console.log("No hay review en progreso.");
   return null;
 } catch (error) {
   console.error("Error leyendo review en progreso:", error);
   return null;
 }
}
// ======================================================
// CONTINUAR REVIEW EN PROGRESO
// ======================================================
function continuarReviewEnProgresoAuditoria() {
 const progreso = obtenerReviewEnProgresoAuditoria();
 if (
   !progreso ||
   !progreso.ultimaPagina ||
   !progreso.ultimaPagina.hrefRelativo
 ) {
   alert("No se encontró una página válida para continuar.");
   return;
 }
 window.location.href = progreso.ultimaPagina.hrefRelativo;
}
// ======================================================
// FORMATEAR FECHA
// ======================================================
function formatearFechaProgresoAuditoria(fechaIso) {
 if (!fechaIso) return "";
 try {
   const fecha = new Date(fechaIso);
   if (Number.isNaN(fecha.getTime())) return "";
   return fecha.toLocaleString("es-MX", {
     year: "numeric",
     month: "2-digit",
     day: "2-digit",
     hour: "2-digit",
     minute: "2-digit"
   });
 } catch (error) {
   return "";
 }
}
// ======================================================
// RENDERIZAR BOTÓN CONTINUAR PROGRESO
// ======================================================
function renderBotonContinuarProgresoAuditoria() {
 const contenedor = document.getElementById("contenedorReviewEnProgreso");
 if (!contenedor) {
   console.warn("No existe el contenedor #contenedorReviewEnProgreso en Auditoria.html");
   return;
 }
 const progreso = obtenerReviewEnProgresoAuditoria();
 // Si no hay progreso, no mostramos nada
 if (!progreso) {
   contenedor.innerHTML = "";
   contenedor.style.display = "none";
   return;
 }
 const fechaUltimoGuardado = formatearFechaProgresoAuditoria(
   progreso.actualizadoEn ||
   progreso.fechaUltimoGuardado ||
   progreso.guardadoEn ||
   ""
 );
 contenedor.style.display = "block";
 contenedor.innerHTML = `
<button
     type="button"
     id="btnContinuarReviewEnProgreso"
     class="btn btn-outline-primary px-4"
     title="${fechaUltimoGuardado ? `Último guardado: ${fechaUltimoGuardado}` : "Continuar progreso"}"
>
<i class="fa-solid fa-arrow-right"></i>
     Continuar progreso
</button>
 `;
 const btnContinuar = document.getElementById("btnContinuarReviewEnProgreso");
 if (btnContinuar) {
   btnContinuar.addEventListener("click", function (e) {
     e.preventDefault();
     continuarReviewEnProgresoAuditoria();
   });
 }
}
// ======================================================
// INICIO
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
 renderBotonContinuarProgresoAuditoria();
});
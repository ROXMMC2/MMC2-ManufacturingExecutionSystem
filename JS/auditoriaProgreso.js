// ======================================================
// AUDITORÍA - CONTINUAR PROGRESO
// Archivo: auditoriaProgreso.js
//
// Este archivo va SOLO en Auditoria.html.
// Si existe una review en progreso:
// - Muestra BU y PL auditadas.
// - Muestra botón "Continuar progreso".
// - Deshabilita "Empezar evaluación".
// - Bloquea los campos principales para evitar iniciar otra.
// NO toca Azure SQL.
// ======================================================

const STORAGE_KEY_REVIEW_EN_PROGRESO_AUDITORIA = "reviewEnProgresoActual";

// ======================================================
// HELPERS
// ======================================================
function escapeHTMLAuditoriaProgreso(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizarTextoAuditoriaProgreso(value) {
  return String(value || "").trim();
}

// ======================================================
// USUARIO ACTUAL
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
    // 1. Primero busca con el usuario actual
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
        return progresoUsuarioActual;
      }
    }

    // 2. Si no lo encuentra, busca cualquier progreso guardado
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key) continue;

      if (!key.startsWith(`${STORAGE_KEY_REVIEW_EN_PROGRESO_AUDITORIA}_`)) {
        continue;
      }

      const raw = localStorage.getItem(key);

      if (!raw) continue;

      try {
        const progreso = JSON.parse(raw);

        if (
          progreso &&
          progreso.enProgreso === true &&
          progreso.ultimaPagina &&
          progreso.ultimaPagina.hrefRelativo
        ) {
          return progreso;
        }
      } catch (errorInterno) {
        console.warn("No se pudo leer esta llave de progreso:", key, errorInterno);
      }
    }

    return null;

  } catch (error) {
    console.error("Error leyendo review en progreso:", error);
    return null;
  }
}

// ======================================================
// EXTRAER DATOS DE BU / PL
// ======================================================
function obtenerDatosBUyPLDesdeProgreso(progreso) {
  if (!progreso) {
    return {
      businessUnit: "",
      businessUnitTexto: "",
      productionLine: "",
      productionLineTexto: ""
    };
  }

  const businessUnit =
    progreso.businessUnit ||
    progreso.idBusinessUnit ||
    progreso.id_business_unit ||
    progreso.bu ||
    "";

  const businessUnitTexto =
    progreso.businessUnitTexto ||
    progreso.businessUnitName ||
    progreso.businessUnitNombre ||
    progreso.business_unit ||
    progreso.buTexto ||
    progreso.bu ||
    progreso.businessUnit ||
    "";

  const productionLine =
    progreso.productionLine ||
    progreso.idProductionLine ||
    progreso.id_production_line ||
    progreso.pl ||
    "";

  const productionLineTexto =
    progreso.productionLineTexto ||
    progreso.productionLineName ||
    progreso.productionLineNombre ||
    progreso.production_line ||
    progreso.plTexto ||
    progreso.pl ||
    progreso.productionLine ||
    "";

  return {
    businessUnit: normalizarTextoAuditoriaProgreso(businessUnit),
    businessUnitTexto: normalizarTextoAuditoriaProgreso(businessUnitTexto),
    productionLine: normalizarTextoAuditoriaProgreso(productionLine),
    productionLineTexto: normalizarTextoAuditoriaProgreso(productionLineTexto)
  };
}

// ======================================================
// SELECCIONAR VALOR EN SELECT
// ======================================================
function seleccionarValorEnSelect(selectId, valor, texto) {
  const select = document.getElementById(selectId);

  if (!select) return;

  const valorNormalizado = String(valor || "").trim().toLowerCase();
  const textoNormalizado = String(texto || "").trim().toLowerCase();

  let encontrado = false;

  Array.from(select.options).forEach((option) => {
    const optionValue = String(option.value || "").trim().toLowerCase();
    const optionText = String(option.textContent || "").trim().toLowerCase();

    if (
      valorNormalizado &&
      optionValue === valorNormalizado
    ) {
      option.selected = true;
      encontrado = true;
      return;
    }

    if (
      textoNormalizado &&
      optionText === textoNormalizado
    ) {
      option.selected = true;
      encontrado = true;
      return;
    }
  });

  if (encontrado) {
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

// ======================================================
// BLOQUEAR FORMULARIO CUANDO HAY PROGRESO
// ======================================================
function bloquearFormularioPorProgreso(progreso) {
  const btnStart = document.getElementById("btnStart");
  const businessUnitSelect = document.getElementById("businessUnit");
  const productionLineSelect = document.getElementById("productionLine");
  const reviewerSelect = document.getElementById("reviewerSelect");
  const assessmentDate = document.getElementById("assessmentDate");

  const datos = obtenerDatosBUyPLDesdeProgreso(progreso);

  // Seleccionar BU/PL guardadas
  seleccionarValorEnSelect("businessUnit", datos.businessUnit, datos.businessUnitTexto);

  // Dar tiempo a que tu JS filtre/cargue Production Lines después de cambiar BU
  setTimeout(() => {
    seleccionarValorEnSelect("productionLine", datos.productionLine, datos.productionLineTexto);
  }, 150);

  // Bloquear campos para que no empiecen otra auditoría encima
  if (businessUnitSelect) businessUnitSelect.disabled = true;
  if (productionLineSelect) productionLineSelect.disabled = true;
  if (reviewerSelect) reviewerSelect.disabled = true;
  if (assessmentDate) assessmentDate.disabled = true;

  // Deshabilitar Empezar evaluación
  if (btnStart) {
    btnStart.disabled = true;
    btnStart.classList.add("disabled");
    btnStart.title = "Ya existe una review en progreso. Debes continuar el progreso actual.";
    btnStart.style.pointerEvents = "none";
    btnStart.style.opacity = "0.65";
  }
}

// ======================================================
// DESBLOQUEAR FORMULARIO SI NO HAY PROGRESO
// ======================================================
function desbloquearFormularioSinProgreso() {
  const btnStart = document.getElementById("btnStart");
  const businessUnitSelect = document.getElementById("businessUnit");
  const productionLineSelect = document.getElementById("productionLine");
  const reviewerSelect = document.getElementById("reviewerSelect");
  const assessmentDate = document.getElementById("assessmentDate");

  if (businessUnitSelect) businessUnitSelect.disabled = false;
  if (productionLineSelect) productionLineSelect.disabled = false;
  if (reviewerSelect) reviewerSelect.disabled = false;
  if (assessmentDate) assessmentDate.disabled = false;

  if (btnStart) {
    btnStart.disabled = false;
    btnStart.classList.remove("disabled");
    btnStart.title = "";
    btnStart.style.pointerEvents = "";
    btnStart.style.opacity = "";
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
// RENDERIZAR BOTÓN E INFO
// ======================================================
function renderBotonContinuarProgresoAuditoria() {
  const contenedor = document.getElementById("contenedorReviewEnProgreso");

  if (!contenedor) {
    console.warn("No existe el contenedor #contenedorReviewEnProgreso en Auditoria.html");
    return;
  }

  const progreso = obtenerReviewEnProgresoAuditoria();

  // Si no hay progreso, no mostramos nada y dejamos el formulario normal
  if (!progreso) {
    contenedor.innerHTML = "";
    contenedor.style.display = "none";
    desbloquearFormularioSinProgreso();
    return;
  }

  bloquearFormularioPorProgreso(progreso);

  const datos = obtenerDatosBUyPLDesdeProgreso(progreso);

  const businessUnitTexto =
    datos.businessUnitTexto ||
    datos.businessUnit ||
    "No especificada";

  const productionLineTexto =
    datos.productionLineTexto ||
    datos.productionLine ||
    "No especificada";

  const fechaUltimoGuardado = formatearFechaProgresoAuditoria(
    progreso.actualizadoEn ||
    progreso.fechaUltimoGuardado ||
    progreso.guardadoEn ||
    ""
  );

  contenedor.style.display = "block";

  contenedor.innerHTML = `
    <div class="review-progress-inline">
      <div class="review-progress-text">
        <div class="review-progress-title">
          <i class="fa-solid fa-clock-rotate-left"></i>
          Review en progreso
        </div>

        <div class="review-progress-details">
          <span>
            <strong>BU:</strong>
            ${escapeHTMLAuditoriaProgreso(businessUnitTexto)}
          </span>

          <span>
            <strong>PL:</strong>
            ${escapeHTMLAuditoriaProgreso(productionLineTexto)}
          </span>

          ${
            fechaUltimoGuardado
              ? `<span><strong>Guardado:</strong> ${escapeHTMLAuditoriaProgreso(fechaUltimoGuardado)}</span>`
              : ""
          }
        </div>
      </div>

      <button
        type="button"
        id="btnContinuarReviewEnProgreso"
        class="btn btn-outline-primary px-4"
      >
        <i class="fa-solid fa-arrow-right"></i>
        Continuar progreso
      </button>
    </div>
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
  // Pequeño delay para que auth.js / JavaScript.js carguen usuario y selects
  setTimeout(() => {
    renderBotonContinuarProgresoAuditoria();
  }, 300);
});
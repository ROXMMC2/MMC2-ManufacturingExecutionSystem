
const STORAGE_KEY_REVIEW_EN_PROGRESO = "reviewEnProgresoActual";

// IMPORTANTE:
// Si tus módulos están en la misma carpeta que Auditoria.html, usa "./Auditoria.html"
// Si tus módulos están en una subcarpeta, usa "../Auditoria.html"
const URL_AUDITORIA = "./Auditoria.html";

// ======================================================
// USUARIO
// ======================================================
function getUsuarioSesionProgreso() {
  try {
    return (
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(localStorage.getItem("user")) ||
      null
    );
  } catch (error) {
    return null;
  }
}

function getUsuarioKeyProgreso() {
  const user = getUsuarioSesionProgreso();

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

function getStorageKeyReviewEnProgreso() {
  return `${STORAGE_KEY_REVIEW_EN_PROGRESO}_${getUsuarioKeyProgreso()}`;
}

// ======================================================
// HELPERS GENERALES
// ======================================================
function obtenerInfoPaginaActual() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hrefRelativo: window.location.pathname + window.location.search,
    hrefCompleto: window.location.href
  };
}

function obtenerParametroURL(nombre) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nombre) || "";
}

function obtenerValorElementoProgreso(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function obtenerTextoSelectProgreso(id) {
  const el = document.getElementById(id);

  if (!el || el.selectedIndex < 0) return "";

  const option = el.options[el.selectedIndex];

  if (!option) return "";

  const texto = String(option.textContent || "").trim();

  if (
    texto.toLowerCase().includes("select") ||
    texto.toLowerCase().includes("selecciona")
  ) {
    return "";
  }

  return texto;
}

// ======================================================
// LEER DATOS DE AUDITORÍA GUARDADOS
// ======================================================
function obtenerDatosAuditoriaGuardadosProgreso() {
  try {
    const posiblesKeys = [
      "auditData",
      "auditoriaData",
      "reviewData",
      "currentAudit",
      "datosAuditoria",
      "modelLineAuditData",
      "auditInfo",
      "reviewInfo"
    ];

    for (const key of posiblesKeys) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      let data = null;

      try {
        data = JSON.parse(raw);
      } catch {
        continue;
      }

      if (!data || typeof data !== "object") continue;

      return {
        businessUnit:
          data.businessUnit ||
          data.idBusinessUnit ||
          data.id_business_unit ||
          data.bu ||
          data.business_unit ||
          "",

        businessUnitTexto:
          data.businessUnitTexto ||
          data.businessUnitName ||
          data.businessUnitNombre ||
          data.businessUnitLabel ||
          data.business_unit ||
          data.buTexto ||
          data.buName ||
          data.bu ||
          data.businessUnit ||
          "",

        productionLine:
          data.productionLine ||
          data.idProductionLine ||
          data.id_production_line ||
          data.pl ||
          data.production_line ||
          "",

        productionLineTexto:
          data.productionLineTexto ||
          data.productionLineName ||
          data.productionLineNombre ||
          data.productionLineLabel ||
          data.production_line ||
          data.plTexto ||
          data.plName ||
          data.pl ||
          data.productionLine ||
          "",

        reviewer:
          data.reviewer ||
          data.reviewerName ||
          data.reviewerTexto ||
          data.reviewerSelect ||
          "",

        assessmentDate:
          data.assessmentDate ||
          data.fecha ||
          data.fechaAuditoria ||
          data.date ||
          ""
      };
    }

    return {
      businessUnit: "",
      businessUnitTexto: "",
      productionLine: "",
      productionLineTexto: "",
      reviewer: "",
      assessmentDate: ""
    };

  } catch (error) {
    console.warn("No se pudieron leer datos de auditoría guardados:", error);

    return {
      businessUnit: "",
      businessUnitTexto: "",
      productionLine: "",
      productionLineTexto: "",
      reviewer: "",
      assessmentDate: ""
    };
  }
}

// ======================================================
// OBTENER BU Y PL
// ======================================================
function obtenerBusinessUnitYProductionLineProgreso() {
  const datosStorage = obtenerDatosAuditoriaGuardadosProgreso();

  const buURL =
    obtenerParametroURL("bu") ||
    obtenerParametroURL("businessUnit") ||
    obtenerParametroURL("idBusinessUnit");

  const buTextoURL =
    obtenerParametroURL("buTexto") ||
    obtenerParametroURL("businessUnitTexto") ||
    obtenerParametroURL("businessUnitName");

  const plURL =
    obtenerParametroURL("pl") ||
    obtenerParametroURL("productionLine") ||
    obtenerParametroURL("idProductionLine");

  const plTextoURL =
    obtenerParametroURL("plTexto") ||
    obtenerParametroURL("productionLineTexto") ||
    obtenerParametroURL("productionLineName");

  const businessUnit =
    obtenerValorElementoProgreso("businessUnit") ||
    obtenerValorElementoProgreso("selectBusinessUnit") ||
    obtenerValorElementoProgreso("hallazgoBusinessUnit") ||
    datosStorage.businessUnit ||
    buURL ||
    "";

  const businessUnitTexto =
    obtenerTextoSelectProgreso("businessUnit") ||
    obtenerTextoSelectProgreso("selectBusinessUnit") ||
    obtenerTextoSelectProgreso("hallazgoBusinessUnit") ||
    datosStorage.businessUnitTexto ||
    buTextoURL ||
    datosStorage.businessUnit ||
    buURL ||
    "";

  const productionLine =
    obtenerValorElementoProgreso("productionLine") ||
    obtenerValorElementoProgreso("selectProductionLine") ||
    obtenerValorElementoProgreso("hallazgoProductionLine") ||
    datosStorage.productionLine ||
    plURL ||
    "";

  const productionLineTexto =
    obtenerTextoSelectProgreso("productionLine") ||
    obtenerTextoSelectProgreso("selectProductionLine") ||
    obtenerTextoSelectProgreso("hallazgoProductionLine") ||
    datosStorage.productionLineTexto ||
    plTextoURL ||
    datosStorage.productionLine ||
    plURL ||
    "";

  return {
    businessUnit: String(businessUnit || "").trim(),
    businessUnitTexto: String(businessUnitTexto || "").trim(),
    productionLine: String(productionLine || "").trim(),
    productionLineTexto: String(productionLineTexto || "").trim(),
    reviewer: String(datosStorage.reviewer || "").trim(),
    assessmentDate: String(datosStorage.assessmentDate || "").trim()
  };
}

// ======================================================
// OBTENER REVIEW EN PROGRESO
// ======================================================
function obtenerReviewEnProgreso() {
  try {
    const raw = localStorage.getItem(getStorageKeyReviewEnProgreso());

    if (!raw) return null;

    return JSON.parse(raw);

  } catch (error) {
    console.error("Error leyendo review en progreso:", error);
    return null;
  }
}

// ======================================================
// OBTENER RESPUESTAS ACTUALES DE LA PÁGINA
// ======================================================
function obtenerRespuestasActuales() {
  const respuestas = {};

  // Radios seleccionados
  document.querySelectorAll("input[type='radio']:checked").forEach((input) => {
    if (!input.name) return;

    respuestas[input.name] = input.value;
  });

  // Checkboxes
  document.querySelectorAll("input[type='checkbox']").forEach((input) => {
    if (!input.name) return;

    if (!Array.isArray(respuestas[input.name])) {
      respuestas[input.name] = [];
    }

    if (input.checked) {
      respuestas[input.name].push(input.value);
    }
  });

  // Inputs normales, fechas, textarea y selects
  document
    .querySelectorAll("input[type='text'], input[type='number'], input[type='date'], textarea, select")
    .forEach((input) => {
      const key = input.name || input.id;

      if (!key) return;

      respuestas[key] = input.value;
    });

  return respuestas;
}

// ======================================================
// APLICAR RESPUESTAS GUARDADAS
// ======================================================
function aplicarRespuestasGuardadas(respuestas) {
  if (!respuestas || typeof respuestas !== "object") return;

  Object.keys(respuestas).forEach((key) => {
    const valor = respuestas[key];

    // RADIO
    const radio = document.querySelector(
      `input[type='radio'][name="${CSS.escape(key)}"][value="${CSS.escape(String(valor))}"]`
    );

    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    // CHECKBOXES
    if (Array.isArray(valor)) {
      valor.forEach((v) => {
        const checkbox = document.querySelector(
          `input[type='checkbox'][name="${CSS.escape(key)}"][value="${CSS.escape(String(v))}"]`
        );

        if (checkbox) {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });

      return;
    }

    // INPUT / SELECT / TEXTAREA POR ID
    const inputById = document.getElementById(key);

    if (inputById) {
      inputById.value = valor;
      inputById.dispatchEvent(new Event("input", { bubbles: true }));
      inputById.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    // INPUT / SELECT / TEXTAREA POR NAME
    const inputByName = document.querySelector(`[name="${CSS.escape(key)}"]`);

    if (inputByName) {
      inputByName.value = valor;
      inputByName.dispatchEvent(new Event("input", { bubbles: true }));
      inputByName.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

// ======================================================
// GUARDAR PROGRESO Y MANDAR A AUDITORÍA
// ======================================================
function guardarProgresoPreguntas() {
  try {
    const progresoAnterior = obtenerReviewEnProgreso();

    const progreso = progresoAnterior || {
      creadoEn: new Date().toISOString(),
      usuarioKey: getUsuarioKeyProgreso(),
      paginas: {}
    };

    const paginaActual = obtenerInfoPaginaActual();
    const keyPagina = paginaActual.hrefRelativo;

    const datosAuditoria = obtenerBusinessUnitYProductionLineProgreso();

    progreso.enProgreso = true;
    progreso.actualizadoEn = new Date().toISOString();
    progreso.ultimaPagina = paginaActual;

    // Guardar BU / PL para mostrarlas en Auditoria.html
    progreso.businessUnit = datosAuditoria.businessUnit;
    progreso.businessUnitTexto = datosAuditoria.businessUnitTexto;
    progreso.productionLine = datosAuditoria.productionLine;
    progreso.productionLineTexto = datosAuditoria.productionLineTexto;

    // Extra opcional
    progreso.reviewer = datosAuditoria.reviewer;
    progreso.assessmentDate = datosAuditoria.assessmentDate;

    progreso.paginas[keyPagina] = {
      pagina: paginaActual,
      respuestas: obtenerRespuestasActuales(),
      businessUnit: datosAuditoria.businessUnit,
      businessUnitTexto: datosAuditoria.businessUnitTexto,
      productionLine: datosAuditoria.productionLine,
      productionLineTexto: datosAuditoria.productionLineTexto,
      guardadoEn: new Date().toISOString()
    };

    localStorage.setItem(getStorageKeyReviewEnProgreso(), JSON.stringify(progreso));

    // Después de guardar, mandar al apartado de auditoría
    window.location.href = URL_AUDITORIA;

  } catch (error) {
    console.error("Error guardando progreso:", error);
    alert("No se pudo guardar el progreso.");
  }
}

// ======================================================
// CARGAR RESPUESTAS DE ESTA PÁGINA
// ======================================================
function cargarProgresoDeEstaPagina() {
  const progreso = obtenerReviewEnProgreso();

  if (!progreso || !progreso.paginas) return;

  const paginaActual = window.location.pathname + window.location.search;
  const progresoPaginaActual = progreso.paginas[paginaActual];

  if (!progresoPaginaActual || !progresoPaginaActual.respuestas) return;

  aplicarRespuestasGuardadas(progresoPaginaActual.respuestas);
}

// ======================================================
// LIMPIAR PROGRESO CUANDO SE GUARDE LA REVIEW FINAL
// Llama esta función después de guardar la review real en Azure SQL.
// ======================================================
function limpiarReviewEnProgreso() {
  localStorage.removeItem(getStorageKeyReviewEnProgreso());
}

// Hacerla global por si la necesitas desde otro JS
window.limpiarReviewEnProgreso = limpiarReviewEnProgreso;

// ======================================================
// EVENTO DEL BOTÓN
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
  const btnGuardarProgreso = document.getElementById("btnGuardarProgresoPreguntas");

  if (btnGuardarProgreso) {
    btnGuardarProgreso.addEventListener("click", function (e) {
      e.preventDefault();
      guardarProgresoPreguntas();
    });
  }

  // Espera por si las preguntas se cargan dinámicamente
  setTimeout(() => {
    cargarProgresoDeEstaPagina();
  }, 500);
});

const STORAGE_KEY_REVIEW_EN_PROGRESO = "reviewEnProgresoActual";

const URL_AUDITORIA = "./Auditoria.html";

// ======================================================
// CATÁLOGOS LOCALES PARA CONVERTIR ID A TEXTO
// ======================================================
const BUSINESS_UNITS_MAP = {
  "1": "LCS",
  "2": "LVP",
  "3": "IDB",
  "4": "LVMCC"
};

const PRODUCTION_LINES_MAP = {
  "1": "Oxy",
  "2": "Cell 2",
  "3": "Cell 3 (Vandelay)",
  "4": "PEFT",
  "5": "AMAT",
  "6": "LVP",
  "7": "UPS",
  "8": "UPS On-Machine",
  "9": "Carrier",
  "10": "Cabinets",
  "11": "Frames",
  "12": "Finals",
  "13": "Units",
  "14": "Sub Assy",
  "15": "Fabrication",
  "16": "Painting"
};

// ======================================================
// USUARIO ACTUAL
// ======================================================
function getUsuarioSesionProgreso() {
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

function getUsuarioKeyProgreso() {
  const user = getUsuarioSesionProgreso();

  if (!user) return "";

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
    ""
  ).trim();
}

function getStorageKeyReviewEnProgreso() {
  const usuarioKey = getUsuarioKeyProgreso();

  if (!usuarioKey) return "";

  return `${STORAGE_KEY_REVIEW_EN_PROGRESO}_${usuarioKey}`;
}

// ======================================================
// HELPERS GENERALES
// ======================================================
function limpiarTextoProgreso(value) {
  return String(value || "").trim();
}

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
  return el ? limpiarTextoProgreso(el.value) : "";
}

function obtenerTextoSelectProgreso(id) {
  const el = document.getElementById(id);

  if (!el || el.selectedIndex < 0) return "";

  const option = el.options[el.selectedIndex];

  if (!option) return "";

  const texto = limpiarTextoProgreso(option.textContent);

  if (
    texto.toLowerCase().includes("select") ||
    texto.toLowerCase().includes("selecciona")
  ) {
    return "";
  }

  return texto;
}

function obtenerTextoBU(idOrText) {
  const value = limpiarTextoProgreso(idOrText);
  if (!value) return "";
  return BUSINESS_UNITS_MAP[value] || value;
}

function obtenerTextoPL(idOrText) {
  const value = limpiarTextoProgreso(idOrText);
  if (!value) return "";
  return PRODUCTION_LINES_MAP[value] || value;
}

// ======================================================
// EXTRAER DATOS DE AUDITORÍA DESDE OBJETO
// Soporta nombres normalizados y nombres de tu backend.
// ======================================================
function extraerDatosAuditoriaDesdeObjeto(data) {
  if (!data || typeof data !== "object") return null;

  const businessUnit =
    data.businessUnit ||
    data.idBusinessUnit ||
    data.IdBusinessUnit ||
    data.id_business_unit ||
    data.businessUnitId ||
    data.bu ||
    data.buId ||
    data.selectedBU ||
    data.selectedBusinessUnit ||
    "";

  const businessUnitTexto =
    data.businessUnitTexto ||
    data.NombreBusinessUnit ||
    data.businessUnitName ||
    data.businessUnitNombre ||
    data.businessUnitLabel ||
    data.business_unit ||
    data.buTexto ||
    data.buName ||
    data.buLabel ||
    data.buNombre ||
    "";

  const productionLine =
    data.productionLine ||
    data.idProductionLine ||
    data.IdProductionLine ||
    data.id_production_line ||
    data.productionLineId ||
    data.pl ||
    data.plId ||
    data.selectedPL ||
    data.selectedProductionLine ||
    "";

  const productionLineTexto =
    data.productionLineTexto ||
    data.NombreProductionLine ||
    data.productionLineName ||
    data.productionLineNombre ||
    data.productionLineLabel ||
    data.production_line ||
    data.plTexto ||
    data.plName ||
    data.plLabel ||
    data.plNombre ||
    "";

  const reviewer =
    data.reviewer ||
    data.IdUsuario ||
    data.idUsuario ||
    data.id_usuario ||
    data.reviewerId ||
    data.reviewerSelect ||
    "";

  const reviewerTexto =
    data.reviewerTexto ||
    data.NombreUsuario ||
    data.reviewerName ||
    data.reviewerNombre ||
    "";

  const assessmentDate =
    data.assessmentDate ||
    data.FechaReview ||
    data.fecha ||
    data.fechaAuditoria ||
    data.date ||
    data.assessment_date ||
    "";

  if (
    businessUnit ||
    businessUnitTexto ||
    productionLine ||
    productionLineTexto ||
    reviewer ||
    reviewerTexto ||
    assessmentDate
  ) {
    return {
      businessUnit: limpiarTextoProgreso(businessUnit),
      businessUnitTexto: limpiarTextoProgreso(businessUnitTexto),
      productionLine: limpiarTextoProgreso(productionLine),
      productionLineTexto: limpiarTextoProgreso(productionLineTexto),
      reviewer: limpiarTextoProgreso(reviewer),
      reviewerTexto: limpiarTextoProgreso(reviewerTexto),
      assessmentDate: limpiarTextoProgreso(assessmentDate)
    };
  }

  return null;
}

// ======================================================
// BUSCAR DATOS DE AUDITORÍA EN LLAVES CONOCIDAS
//
// IMPORTANTE:
// Ya NO busca en todo localStorage para evitar tomar datos
// de otro usuario.
// ======================================================
function obtenerDatosAuditoriaGuardadosProgreso() {
  try {
    const posiblesKeys = [
      "modelLineAuditData",
      "reviewInfo",
      "auditData",
      "auditoriaData",
      "reviewData",
      "currentAudit",
      "datosAuditoria",
      "auditInfo",
      "assessmentData",
      "modelLineAssessment",
      "datosEvaluacion"
    ];

    for (const key of posiblesKeys) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      try {
        const data = JSON.parse(raw);
        const datos = extraerDatosAuditoriaDesdeObjeto(data);

        if (datos) return datos;
      } catch (errorInterno) {
        continue;
      }
    }

    return {
      businessUnit: "",
      businessUnitTexto: "",
      productionLine: "",
      productionLineTexto: "",
      reviewer: "",
      reviewerTexto: "",
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
      reviewerTexto: "",
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
    obtenerParametroURL("idBusinessUnit") ||
    obtenerParametroURL("businessUnitId");

  const buTextoURL =
    obtenerParametroURL("buTexto") ||
    obtenerParametroURL("businessUnitTexto") ||
    obtenerParametroURL("businessUnitName") ||
    obtenerParametroURL("buName");

  const plURL =
    obtenerParametroURL("pl") ||
    obtenerParametroURL("productionLine") ||
    obtenerParametroURL("idProductionLine") ||
    obtenerParametroURL("productionLineId");

  const plTextoURL =
    obtenerParametroURL("plTexto") ||
    obtenerParametroURL("productionLineTexto") ||
    obtenerParametroURL("productionLineName") ||
    obtenerParametroURL("plName");

  const businessUnit =
    obtenerValorElementoProgreso("businessUnit") ||
    obtenerValorElementoProgreso("selectBusinessUnit") ||
    obtenerValorElementoProgreso("hallazgoBusinessUnit") ||
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

  const businessUnitTexto =
    obtenerTextoSelectProgreso("businessUnit") ||
    obtenerTextoSelectProgreso("selectBusinessUnit") ||
    obtenerTextoSelectProgreso("hallazgoBusinessUnit") ||
    datosStorage.businessUnitTexto ||
    buTextoURL ||
    obtenerTextoBU(businessUnit) ||
    "";

  const productionLineTexto =
    obtenerTextoSelectProgreso("productionLine") ||
    obtenerTextoSelectProgreso("selectProductionLine") ||
    obtenerTextoSelectProgreso("hallazgoProductionLine") ||
    datosStorage.productionLineTexto ||
    plTextoURL ||
    obtenerTextoPL(productionLine) ||
    "";

  return {
    businessUnit: limpiarTextoProgreso(businessUnit),
    businessUnitTexto: limpiarTextoProgreso(businessUnitTexto),
    productionLine: limpiarTextoProgreso(productionLine),
    productionLineTexto: limpiarTextoProgreso(productionLineTexto),
    reviewer: limpiarTextoProgreso(datosStorage.reviewer),
    reviewerTexto: limpiarTextoProgreso(datosStorage.reviewerTexto),
    assessmentDate: limpiarTextoProgreso(datosStorage.assessmentDate)
  };
}

// ======================================================
// OBTENER REVIEW EN PROGRESO DEL USUARIO ACTUAL
// ======================================================
function obtenerReviewEnProgreso() {
  try {
    const usuarioKey = getUsuarioKeyProgreso();
    const storageKey = getStorageKeyReviewEnProgreso();

    if (!usuarioKey || !storageKey) {
      console.log("No hay usuario logueado. No se busca progreso.");
      return null;
    }

    const raw = localStorage.getItem(storageKey);

    if (!raw) return null;

    const progreso = JSON.parse(raw);

    // Seguridad extra:
    // Si el progreso tiene usuarioKey, debe coincidir con el usuario actual.
    if (
      progreso &&
      progreso.usuarioKey &&
      String(progreso.usuarioKey).trim() !== String(usuarioKey).trim()
    ) {
      console.warn("El progreso encontrado no pertenece al usuario actual. Se ignora.", {
        usuarioActual: usuarioKey,
        usuarioProgreso: progreso.usuarioKey
      });

      return null;
    }

    return progreso;

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
    const usuarioKey = getUsuarioKeyProgreso();
    const storageKey = getStorageKeyReviewEnProgreso();

    if (!usuarioKey || !storageKey) {
      alert("No se encontró el usuario actual. Vuelve a iniciar sesión.");
      return;
    }

    const progresoAnterior = obtenerReviewEnProgreso();

    const progreso = progresoAnterior || {
      creadoEn: new Date().toISOString(),
      usuarioKey: usuarioKey,
      paginas: {}
    };

    const paginaActual = obtenerInfoPaginaActual();
    const keyPagina = paginaActual.hrefRelativo;

    const datosAuditoria = obtenerBusinessUnitYProductionLineProgreso();

    progreso.enProgreso = true;
    progreso.usuarioKey = usuarioKey;
    progreso.actualizadoEn = new Date().toISOString();
    progreso.ultimaPagina = paginaActual;

    // Guardar BU / PL para mostrarlas arriba en Auditoria.html
    progreso.businessUnit = datosAuditoria.businessUnit;
    progreso.businessUnitTexto = datosAuditoria.businessUnitTexto;
    progreso.productionLine = datosAuditoria.productionLine;
    progreso.productionLineTexto = datosAuditoria.productionLineTexto;

    // Extra
    progreso.reviewer = datosAuditoria.reviewer;
    progreso.reviewerTexto = datosAuditoria.reviewerTexto;
    progreso.assessmentDate = datosAuditoria.assessmentDate;

    if (!progreso.paginas || typeof progreso.paginas !== "object") {
      progreso.paginas = {};
    }

    progreso.paginas[keyPagina] = {
      pagina: paginaActual,
      respuestas: obtenerRespuestasActuales(),
      businessUnit: datosAuditoria.businessUnit,
      businessUnitTexto: datosAuditoria.businessUnitTexto,
      productionLine: datosAuditoria.productionLine,
      productionLineTexto: datosAuditoria.productionLineTexto,
      reviewer: datosAuditoria.reviewer,
      reviewerTexto: datosAuditoria.reviewerTexto,
      assessmentDate: datosAuditoria.assessmentDate,
      guardadoEn: new Date().toISOString()
    };

    localStorage.setItem(storageKey, JSON.stringify(progreso));

    console.log("Progreso guardado para usuario:", usuarioKey, progreso);

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
  const storageKey = getStorageKeyReviewEnProgreso();

  if (!storageKey) return;

  localStorage.removeItem(storageKey);
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
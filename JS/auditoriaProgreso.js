// ======================================================
// AUDITORÍA - CONTINUAR / CANCELAR PROGRESO
// Archivo: auditoriaProgreso.js
//
// Este archivo va SOLO en Auditoria.html.
//
// Función:
// - Busca review en progreso SOLO del usuario actual.
// - Carga BU, PL, Reviewer y Fecha en los campos de Auditoria.html.
// - Deshabilita "Empezar evaluación" si hay progreso.
// - Muestra "Continuar progreso" y "Cancelar auditoría".
// - Cancelar auditoría borra SOLO el progreso del usuario actual.
//
// NO toca Azure SQL.
// ======================================================

const STORAGE_KEY_REVIEW_EN_PROGRESO_AUDITORIA = "reviewEnProgresoActual";

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

function getStorageKeyReviewEnProgresoAuditoria() {
  const usuarioKey = getUsuarioKeyAuditoriaProgreso();

  if (!usuarioKey) return "";

  return `${STORAGE_KEY_REVIEW_EN_PROGRESO_AUDITORIA}_${usuarioKey}`;
}

// ======================================================
// BUSCAR REVIEW EN PROGRESO SOLO DEL USUARIO ACTUAL
// ======================================================
function obtenerReviewEnProgresoAuditoria() {
  try {
    const usuarioKey = getUsuarioKeyAuditoriaProgreso();
    const storageKey = getStorageKeyReviewEnProgresoAuditoria();

    if (!usuarioKey || !storageKey) {
      console.log("No hay usuario logueado. No se busca progreso.");
      return null;
    }

    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      console.log("No hay progreso para este usuario:", storageKey);
      return null;
    }

    const progreso = JSON.parse(raw);

    if (
      !progreso ||
      progreso.enProgreso !== true ||
      !progreso.ultimaPagina ||
      !progreso.ultimaPagina.hrefRelativo
    ) {
      console.log("El progreso encontrado no es válido:", storageKey);
      return null;
    }

    // Seguridad extra:
    // Si el progreso tiene usuarioKey guardado, debe coincidir con el usuario actual.
    if (
      progreso.usuarioKey &&
      String(progreso.usuarioKey).trim() !== String(usuarioKey).trim()
    ) {
      console.warn("El progreso no pertenece al usuario actual. Se ignora:", {
        usuarioActual: usuarioKey,
        usuarioProgreso: progreso.usuarioKey
      });

      return null;
    }

    console.log("Progreso encontrado para usuario actual:", storageKey);
    return progreso;

  } catch (error) {
    console.error("Error leyendo review en progreso:", error);
    return null;
  }
}

// ======================================================
// OBTENER PARÁMETROS DESDE URL GUARDADA
// ======================================================
function obtenerParametroDesdeUrlGuardada(progreso, nombre) {
  try {
    const search = progreso?.ultimaPagina?.search || "";
    const params = new URLSearchParams(search);

    return params.get(nombre) || "";
  } catch (error) {
    return "";
  }
}

// ======================================================
// EXTRAER BU / PL / REVIEWER / DATE DEL PROGRESO
// ======================================================
function obtenerDatosAuditoriaDesdeProgreso(progreso) {
  if (!progreso) {
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

  const buUrl =
    obtenerParametroDesdeUrlGuardada(progreso, "bu") ||
    obtenerParametroDesdeUrlGuardada(progreso, "businessUnit") ||
    obtenerParametroDesdeUrlGuardada(progreso, "idBusinessUnit");

  const buTextoUrl =
    obtenerParametroDesdeUrlGuardada(progreso, "buTexto") ||
    obtenerParametroDesdeUrlGuardada(progreso, "businessUnitTexto") ||
    obtenerParametroDesdeUrlGuardada(progreso, "businessUnitName");

  const plUrl =
    obtenerParametroDesdeUrlGuardada(progreso, "pl") ||
    obtenerParametroDesdeUrlGuardada(progreso, "productionLine") ||
    obtenerParametroDesdeUrlGuardada(progreso, "idProductionLine");

  const plTextoUrl =
    obtenerParametroDesdeUrlGuardada(progreso, "plTexto") ||
    obtenerParametroDesdeUrlGuardada(progreso, "productionLineTexto") ||
    obtenerParametroDesdeUrlGuardada(progreso, "productionLineName");

  return {
    businessUnit: String(
      progreso.businessUnit ||
      progreso.idBusinessUnit ||
      progreso.IdBusinessUnit ||
      progreso.id_business_unit ||
      progreso.bu ||
      buUrl ||
      ""
    ).trim(),

    businessUnitTexto: String(
      progreso.businessUnitTexto ||
      progreso.NombreBusinessUnit ||
      progreso.businessUnitName ||
      progreso.businessUnitNombre ||
      progreso.business_unit ||
      progreso.buTexto ||
      buTextoUrl ||
      progreso.businessUnit ||
      buUrl ||
      ""
    ).trim(),

    productionLine: String(
      progreso.productionLine ||
      progreso.idProductionLine ||
      progreso.IdProductionLine ||
      progreso.id_production_line ||
      progreso.pl ||
      plUrl ||
      ""
    ).trim(),

    productionLineTexto: String(
      progreso.productionLineTexto ||
      progreso.NombreProductionLine ||
      progreso.productionLineName ||
      progreso.productionLineNombre ||
      progreso.production_line ||
      progreso.plTexto ||
      plTextoUrl ||
      progreso.productionLine ||
      plUrl ||
      ""
    ).trim(),

    // ID del reviewer
    reviewer: String(
      progreso.reviewer ||
      progreso.IdUsuario ||
      progreso.idUsuario ||
      progreso.id_usuario ||
      ""
    ).trim(),

    // Nombre del reviewer
    reviewerTexto: String(
      progreso.reviewerTexto ||
      progreso.NombreUsuario ||
      progreso.reviewerName ||
      progreso.reviewerNombre ||
      progreso.nombreUsuario ||
      progreso.usuario ||
      ""
    ).trim(),

    assessmentDate: String(
      progreso.assessmentDate ||
      progreso.FechaReview ||
      progreso.fecha ||
      progreso.fechaAuditoria ||
      progreso.date ||
      ""
    ).trim()
  };
}

// ======================================================
// SELECCIONAR OPTION EN SELECT
// Si no encuentra option, crea una opción temporal.
// ======================================================
function seleccionarValorEnSelectAuditoria(selectId, valor, texto) {
  const select = document.getElementById(selectId);

  if (!select) return;

  const valorLimpio = String(valor || "").trim();
  const textoLimpio = String(texto || "").trim();

  const valorNormalizado = valorLimpio.toLowerCase();
  const textoNormalizado = textoLimpio.toLowerCase();

  let encontrado = false;

  Array.from(select.options).forEach((option) => {
    const optionValue = String(option.value || "").trim().toLowerCase();
    const optionText = String(option.textContent || "").trim().toLowerCase();

    if (valorNormalizado && optionValue === valorNormalizado) {
      option.selected = true;
      encontrado = true;
      return;
    }

    if (textoNormalizado && optionText === textoNormalizado) {
      option.selected = true;
      encontrado = true;
      return;
    }
  });

  // Si no encuentra coincidencia, crea opción temporal para mostrar el valor.
  if (!encontrado && (valorLimpio || textoLimpio)) {
    const option = document.createElement("option");

    option.value = valorLimpio || textoLimpio;
    option.textContent = textoLimpio || valorLimpio;
    option.selected = true;
    option.setAttribute("data-progress-temp", "true");

    select.appendChild(option);
    encontrado = true;
  }

  if (encontrado) {
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

// ======================================================
// LLENAR CAMPOS DE ARRIBA CON LA REVIEW EN PROGRESO
// ======================================================
function cargarCamposAuditoriaConProgreso(progreso) {
  const datos = obtenerDatosAuditoriaDesdeProgreso(progreso);

  const businessUnitSelect = document.getElementById("businessUnit");
  const productionLineSelect = document.getElementById("productionLine");
  const reviewerSelect = document.getElementById("reviewerSelect");
  const assessmentDateInput = document.getElementById("assessmentDate");

  // 1. Cargar Business Unit
  seleccionarValorEnSelectAuditoria(
    "businessUnit",
    datos.businessUnit,
    datos.businessUnitTexto
  );

  // 2. Cargar Production Line después de que el change de BU filtre líneas
  setTimeout(() => {
    seleccionarValorEnSelectAuditoria(
      "productionLine",
      datos.productionLine,
      datos.productionLineTexto
    );

    if (productionLineSelect) {
      productionLineSelect.disabled = true;
    }
  }, 300);

  // 3. Cargar reviewer con NOMBRE, no solo ID
  if (reviewerSelect) {
    const reviewerValor = datos.reviewer || "";
    const reviewerTexto = datos.reviewerTexto || datos.reviewer || "";

    seleccionarValorEnSelectAuditoria(
      "reviewerSelect",
      reviewerValor,
      reviewerTexto
    );
  }

  // 4. Cargar fecha si existe
  if (assessmentDateInput && datos.assessmentDate) {
    assessmentDateInput.value = datos.assessmentDate;
  }

  // 5. Bloquear campos porque ya hay auditoría en progreso
  if (businessUnitSelect) businessUnitSelect.disabled = true;
  if (reviewerSelect) reviewerSelect.disabled = true;
  if (assessmentDateInput) assessmentDateInput.disabled = true;
}

// ======================================================
// BLOQUEAR BOTÓN EMPEZAR EVALUACIÓN
// ======================================================
function bloquearBotonEmpezarEvaluacion() {
  const btnStart = document.getElementById("btnStart");

  if (!btnStart) return;

  btnStart.disabled = true;
  btnStart.classList.add("disabled");
  btnStart.title = "Ya existe una review en progreso. Debes continuar el progreso actual.";
  btnStart.style.pointerEvents = "none";
  btnStart.style.opacity = "0.65";
}

// ======================================================
// LIMPIAR CAMPOS DE AUDITORÍA DESPUÉS DE CANCELAR
// ======================================================
function limpiarCamposAuditoriaDespuesDeCancelar() {
  const businessUnitSelect = document.getElementById("businessUnit");
  const productionLineSelect = document.getElementById("productionLine");
  const reviewerSelect = document.getElementById("reviewerSelect");
  const assessmentDateInput = document.getElementById("assessmentDate");

  if (businessUnitSelect) {
    businessUnitSelect.disabled = false;
    businessUnitSelect.value = "";
    businessUnitSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (productionLineSelect) {
    productionLineSelect.value = "";
    productionLineSelect.disabled = true;
  }

  if (reviewerSelect) {
    reviewerSelect.disabled = true;
  }

  if (assessmentDateInput) {
    assessmentDateInput.disabled = false;

    if (typeof getFechaLocalSoloFecha === "function") {
      assessmentDateInput.value = getFechaLocalSoloFecha();
    }
  }
}

// ======================================================
// DESBLOQUEAR SI NO HAY PROGRESO DEL USUARIO ACTUAL
// ======================================================
function desbloquearAuditoriaSinProgreso() {
  const btnStart = document.getElementById("btnStart");
  const businessUnitSelect = document.getElementById("businessUnit");
  const productionLineSelect = document.getElementById("productionLine");
  const reviewerSelect = document.getElementById("reviewerSelect");
  const assessmentDateInput = document.getElementById("assessmentDate");

  if (btnStart) {
    btnStart.disabled = false;
    btnStart.classList.remove("disabled");
    btnStart.title = "";
    btnStart.style.pointerEvents = "";
    btnStart.style.opacity = "";
  }

  if (businessUnitSelect) businessUnitSelect.disabled = false;

  // Production Line normalmente inicia deshabilitada hasta seleccionar BU.
  if (productionLineSelect) {
    productionLineSelect.disabled = !businessUnitSelect || !businessUnitSelect.value;
  }

  // Reviewer normalmente debe seguir bloqueado porque viene del usuario logueado.
  if (reviewerSelect) reviewerSelect.disabled = true;

  if (assessmentDateInput) assessmentDateInput.disabled = false;
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
// CANCELAR AUDITORÍA EN PROGRESO
// ======================================================
function cancelarAuditoriaEnProgreso() {
  const storageKey = getStorageKeyReviewEnProgresoAuditoria();

  if (!storageKey) {
    alert("No se encontró el usuario actual. Vuelve a iniciar sesión.");
    return;
  }

  const confirmar = confirm(
    "¿Seguro que deseas cancelar esta auditoría?\n\n"
  );

  if (!confirmar) return;

  try {
    // Borra SOLO el progreso del usuario actual
    localStorage.removeItem(storageKey);

    // Borra datos temporales de la auditoría actual
    localStorage.removeItem("reviewInfo");
    localStorage.removeItem("modelLineAuditData");
    localStorage.removeItem("modulos");

    limpiarCamposAuditoriaDespuesDeCancelar();

    renderBotonContinuarProgresoAuditoria();

    alert("Auditoría cancelada correctamente.");
  } catch (error) {
    console.error("Error cancelando auditoría:", error);
    alert("No se pudo cancelar la auditoría.");
  }
}

// ======================================================
// RENDERIZAR BOTONES CONTINUAR / CANCELAR
// ======================================================
function renderBotonContinuarProgresoAuditoria() {
  const contenedor = document.getElementById("contenedorReviewEnProgreso");

  if (!contenedor) {
    console.warn("No existe el contenedor #contenedorReviewEnProgreso en Auditoria.html");
    return;
  }

  const progreso = obtenerReviewEnProgresoAuditoria();

  if (!progreso) {
    contenedor.innerHTML = "";
    contenedor.style.display = "none";
    desbloquearAuditoriaSinProgreso();
    return;
  }

  // Cargar datos arriba en BU / PL / reviewer / fecha
  cargarCamposAuditoriaConProgreso(progreso);

  // Bloquear botón empezar
  bloquearBotonEmpezarEvaluacion();

  // Mostrar botones
  contenedor.style.display = "block";

  contenedor.innerHTML = `
    <div class="auditoria-progress-actions">
      <button
        type="button"
        id="btnContinuarReviewEnProgreso"
        class="btn btn-outline-primary px-4"
      >
        <i class="fa-solid fa-arrow-right"></i>
        Continuar progreso
      </button>

      <button
        type="button"
        id="btnCancelarAuditoriaProgreso"
        class="btn btn-outline-danger px-4"
      >
        <i class="fa-solid fa-ban"></i>
        Cancelar auditoría
      </button>
    </div>
  `;

  const btnContinuar = document.getElementById("btnContinuarReviewEnProgreso");
  const btnCancelar = document.getElementById("btnCancelarAuditoriaProgreso");

  if (btnContinuar) {
    btnContinuar.addEventListener("click", function (e) {
      e.preventDefault();
      continuarReviewEnProgresoAuditoria();
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", function (e) {
      e.preventDefault();
      cancelarAuditoriaEnProgreso();
    });
  }
}

// ======================================================
// INICIO
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
  // Delay para que JavaScript.js/auth.js carguen usuario, catálogos y reviewer
  setTimeout(() => {
    renderBotonContinuarProgresoAuditoria();
  }, 700);
});
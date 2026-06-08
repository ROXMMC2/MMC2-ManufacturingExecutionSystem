

const STORAGE_KEY_REVIEW_EN_PROGRESO_AUDITORIA = "reviewEnProgresoActual";

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
      progreso.id_business_unit ||
      progreso.bu ||
      buUrl ||
      ""
    ).trim(),

    businessUnitTexto: String(
      progreso.businessUnitTexto ||
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
      progreso.id_production_line ||
      progreso.pl ||
      plUrl ||
      ""
    ).trim(),

    productionLineTexto: String(
      progreso.productionLineTexto ||
      progreso.productionLineName ||
      progreso.productionLineNombre ||
      progreso.production_line ||
      progreso.plTexto ||
      plTextoUrl ||
      progreso.productionLine ||
      plUrl ||
      ""
    ).trim(),

    reviewer: String(
      progreso.reviewer ||
      progreso.reviewerName ||
      progreso.reviewerTexto ||
      ""
    ).trim(),

    assessmentDate: String(
      progreso.assessmentDate ||
      progreso.fecha ||
      progreso.fechaAuditoria ||
      progreso.date ||
      ""
    ).trim()
  };
}

// ======================================================
// SELECCIONAR OPTION EN SELECT
// Si no encuentra option, crea una opción temporal
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

  // Si no encontró coincidencia, crea una opción temporal para mostrar el texto
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

  // 1. Cargar Business Unit en el campo de arriba
  seleccionarValorEnSelectAuditoria(
    "businessUnit",
    datos.businessUnit,
    datos.businessUnitTexto
  );

  // 2. Cargar Production Line en el campo de arriba
  // Pequeño delay por si tu JS filtra PL después de seleccionar BU
  setTimeout(() => {
    seleccionarValorEnSelectAuditoria(
      "productionLine",
      datos.productionLine,
      datos.productionLineTexto
    );

    if (productionLineSelect) {
      productionLineSelect.disabled = true;
    }
  }, 200);

  // 3. Cargar reviewer si existe
  if (reviewerSelect && datos.reviewer) {
    seleccionarValorEnSelectAuditoria("reviewerSelect", datos.reviewer, datos.reviewer);
  }

  // 4. Cargar fecha si existe
  if (assessmentDateInput && datos.assessmentDate) {
    assessmentDateInput.value = datos.assessmentDate;
  }

  // 5. Deshabilitar campos
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
// DESBLOQUEAR SI NO HAY PROGRESO
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
  if (productionLineSelect) productionLineSelect.disabled = false;
  if (reviewerSelect) reviewerSelect.disabled = false;
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
// RENDERIZAR SOLO BOTÓN CONTINUAR PROGRESO
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

  // Cargar los datos arriba, en los campos BU/PL
  cargarCamposAuditoriaConProgreso(progreso);

  // Bloquear empezar evaluación
  bloquearBotonEmpezarEvaluacion();

  // Mostrar solo el botón continuar
  contenedor.style.display = "block";

  contenedor.innerHTML = `
    <button
      type="button"
      id="btnContinuarReviewEnProgreso"
      class="btn btn-outline-primary px-4"
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
  // Delay para que JavaScript.js/auth.js carguen selects y reviewer
  setTimeout(() => {
    renderBotonContinuarProgresoAuditoria();
  }, 500);
});
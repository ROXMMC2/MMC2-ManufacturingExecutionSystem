// ======================================================
// PRO preguntas.// PROGRESO DE PREGUNTAS
// Guarda el progreso en localStorage y manda a Auditoría.
// También restaura respuestas cuando regresas al módulo.
// NO toca Azure SQL.
// ======================================================

const STORAGE_KEY_REVIEW_EN_PROGRESO = "reviewEnProgresoActual";

// IMPORTANTE:
// Si tus módulos están en la misma carpeta que Auditoria.html, usa "./Auditoria.html"
// Si tus módulos están en otra carpeta, puede que necesites "../HTML/Auditoria.html" o similar.
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
    user.username ||
    user.usuario ||
    user.name ||
    user.nombre ||
    "usuario_sin_sesion"
  ).trim();
}

function getStorageKeyReviewEnProgreso() {
  return `${STORAGE_KEY_REVIEW_EN_PROGRESO}_${getUsuarioKeyProgreso()}`;
}

// ======================================================
// INFO DE PÁGINA ACTUAL
// ======================================================
function obtenerInfoPaginaActual() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hrefRelativo: window.location.pathname + window.location.search,
    hrefCompleto: window.location.href
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

    progreso.enProgreso = true;
    progreso.actualizadoEn = new Date().toISOString();
    progreso.ultimaPagina = paginaActual;

    progreso.paginas[keyPagina] = {
      pagina: paginaActual,
      respuestas: obtenerRespuestasActuales(),
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

  // Espera un poco por si las preguntas se cargan dinámicamente
  setTimeout(() => {
    cargarProgresoDeEstaPagina();
  }, 500);
});

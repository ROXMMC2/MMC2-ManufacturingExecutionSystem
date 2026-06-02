// ======================================================
// CONFIGURACIÓN API
// ======================================================
// En Azure debe quedarse vacío para que use el mismo dominio.
// NO usar http://localhost:3000 en Azure.
const API_BASE = "";

// ======================================================
// LOGIN + SIDEBAR + SUBMENÚ REPORTS
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  const usuarioInput = document.getElementById("usuario");
  const contrasenaInput = document.getElementById("password");

  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  // ======================================================
  // LOGIN
  // ======================================================
  if (form && usuarioInput && contrasenaInput) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const usuario = usuarioInput.value.trim();
      const contrasena = contrasenaInput.value.trim();

      if (!usuario || !contrasena) {
        alert("Ingresa usuario y contraseña.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            usuario,
            contrasena
          })
        });

        const text = await response.text();
        let data = {};

        try {
          data = JSON.parse(text);
        } catch (error) {
          data = {
            ok: false,
            error: text || "Respuesta inválida del servidor."
          };
        }

        console.log("Respuesta login:", data);

        if (response.ok && data.ok) {
          const usuarioBackend =
            data.usuario ||
            data.user ||
            data.data ||
            {};

          let rol = String(
            usuarioBackend.rol ||
            usuarioBackend.Rol ||
            usuarioBackend.role ||
            usuarioBackend.tipo ||
            usuarioBackend.tipo_usuario ||
            usuarioBackend.nombre_rol ||
            usuarioBackend.rol_nombre ||
            "usuario"
          ).trim().toLowerCase();

          if (rol === "administrador") rol = "admin";
          if (rol === "administrator") rol = "admin";

          const userData = {
            id:
              usuarioBackend.id ||
              usuarioBackend.idusuario ||
              usuarioBackend.IdUsuario ||
              usuarioBackend.id_usuario ||
              usuarioBackend.usuario_id ||
              null,

            nombre:
              usuarioBackend.nombre ||
              usuarioBackend.Nombre ||
              usuarioBackend.name ||
              usuarioBackend.usuario ||
              usuarioBackend.Usuario ||
              usuarioBackend.username ||
              "Usuario",

            username:
              usuarioBackend.usuario ||
              usuarioBackend.Usuario ||
              usuarioBackend.username ||
              usuario,

            correo:
              usuarioBackend.correo ||
              usuarioBackend.Correo ||
              usuarioBackend.email ||
              "",

            rol
          };

          console.log("Usuario guardado en localStorage:", userData);

          localStorage.removeItem("usuario");
          localStorage.removeItem("usuarioActual");
          localStorage.removeItem("usuarioLogueado");
          localStorage.removeItem("loggedUser");
          localStorage.removeItem("loginUser");
          localStorage.removeItem("sessionUser");

          localStorage.setItem("user", JSON.stringify(userData));

          localStorage.setItem("currentUser", JSON.stringify({
            id: userData.id,
            name: userData.nombre,
            username: userData.username,
            role: userData.rol
          }));

          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect");

          window.location.href = redirect || "index.html";
        } else {
          alert(data.error || data.message || "Credenciales incorrectas.");
        }
      } catch (error) {
        console.error("Error en login:", error);
        alert("No se pudo conectar con el servidor.");
      }
    });
  }

  // ======================================================
  // SIDEBAR TOGGLE
  // ======================================================
  if (toggleSidebar && sidebar) {
    toggleSidebar.addEventListener("click", function () {
      const isMobile = window.innerWidth <= 992;

      if (isMobile) {
        sidebar.classList.toggle("mobile-open");

        if (sidebarOverlay) {
          sidebarOverlay.classList.toggle("show");
        }
      } else {
        sidebar.classList.toggle("collapsed");
      }
    });
  }

  // ======================================================
  // CERRAR SIDEBAR CON OVERLAY
  // ======================================================
  if (sidebarOverlay && sidebar) {
    sidebarOverlay.addEventListener("click", function () {
      sidebar.classList.remove("mobile-open");
      sidebarOverlay.classList.remove("show");
    });
  }

  // ======================================================
  // SUBMENÚ REPORTS EN SIDEBAR
  // ======================================================
  const btnReportsToggle = document.getElementById("btnReportsToggle");
  const reportsSubmenu = document.getElementById("reportsSubmenu");
  const reportsMenuGroup = document.querySelector(".reports-menu-group");

  const linkSubReportes = document.getElementById("linkSubReportes");
  const linkSubPlanAccion = document.getElementById("linkSubPlanAccion");

  if (btnReportsToggle && reportsSubmenu) {
    function abrirSubmenuReports() {
      reportsSubmenu.classList.add("show");

      if (reportsMenuGroup) {
        reportsMenuGroup.classList.add("open");
      }
    }

    function cerrarSubmenuReports() {
      reportsSubmenu.classList.remove("show");

      if (reportsMenuGroup) {
        reportsMenuGroup.classList.remove("open");
      }
    }

    function toggleSubmenuReports() {
      const abierto = reportsSubmenu.classList.contains("show");

      if (abierto) {
        cerrarSubmenuReports();
      } else {
        abrirSubmenuReports();
      }
    }

    function marcarActivoSidebarReports() {
      const path = window.location.pathname.toLowerCase();

      if (linkSubReportes) linkSubReportes.classList.remove("active");
      if (linkSubPlanAccion) linkSubPlanAccion.classList.remove("active");

      if (path.includes("reportes")) {
        abrirSubmenuReports();

        if (linkSubReportes) {
          linkSubReportes.classList.add("active");
        }
      }

      if (
        path.includes("planaccion") ||
        path.includes("plan_accion") ||
        path.includes("actionplan")
      ) {
        abrirSubmenuReports();

        if (linkSubPlanAccion) {
          linkSubPlanAccion.classList.add("active");
        }
      }
    }

    btnReportsToggle.addEventListener("click", function () {
      toggleSubmenuReports();
    });

    marcarActivoSidebarReports();
  }
});

// ======================================================
// HELPERS DE FECHA / HORA LOCAL
// ======================================================
function getFechaLocalSoloFecha() {
  const ahora = new Date();

  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function getFechaHoraLocal() {
  const ahora = new Date();

  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  const hh = String(ahora.getHours()).padStart(2, "0");
  const mi = String(ahora.getMinutes()).padStart(2, "0");
  const ss = String(ahora.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

// ======================================================
// APP CONFIG
// Se deja por compatibilidad.
// Auditoría ya NO depende de localStorage.appConfig.
// ======================================================
function getAppConfigSeguro() {
  try {
    return JSON.parse(localStorage.getItem("appConfig")) || {
      questions: [],
      users: [],
      businessUnits: [],
      productionLines: []
    };
  } catch (error) {
    console.error("Error leyendo appConfig:", error);

    return {
      questions: [],
      users: [],
      businessUnits: [],
      productionLines: []
    };
  }
}

// ======================================================
// USUARIO ACTUAL
// ======================================================
function getCurrentUserSeguro() {
  try {
    return (
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(localStorage.getItem("user")) ||
      null
    );
  } catch (error) {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch (e) {
      return null;
    }
  }
}

// ======================================================
// CARGAR BUSINESS UNITS / PRODUCTION LINES / REVIEWERS
// DESDE AZURE SQL
// ======================================================
async function cargarCatalogosAuditoria() {
  const buSelect = document.getElementById("businessUnit");
  const lineSelect = document.getElementById("productionLine");
  const reviewerSelect = document.getElementById("reviewerSelect");

  if (!buSelect || !lineSelect || !reviewerSelect) {
    console.warn("No se encontraron los selects de auditoría.");
    return;
  }

  let businessUnits = [];
  let productionLines = [];

  try {
    const response = await fetch(`${API_BASE}/api/catalogos?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store"
    });

    console.log("STATUS /api/catalogos:", response.status);

    const text = await response.text();
    console.log("RESPUESTA /api/catalogos:", text);

    let data = {};

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error("La respuesta de /api/catalogos no es JSON válido.");
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.error || data.message || "No se pudieron cargar los catálogos.");
    }

    businessUnits = Array.isArray(data.businessUnits) ? data.businessUnits : [];
    productionLines = Array.isArray(data.productionLines) ? data.productionLines : [];

    console.log("Business Units cargadas:", businessUnits);
    console.log("Production Lines cargadas:", productionLines);
  } catch (error) {
    console.error("Error cargando catálogos desde Azure SQL:", error);
    alert(
      "No se pudieron cargar Business Units y Production Lines desde el servidor.\n\n" +
      "Detalle: " + error.message
    );
    return;
  }

  // ======================================================
  // BUSINESS UNITS
  // ======================================================
  buSelect.innerHTML = "";
  const optionBUDefault = document.createElement("option");
  optionBUDefault.value = "";
  optionBUDefault.textContent = "Select a Business Unit";
  buSelect.appendChild(optionBUDefault);

  businessUnits
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")))
    .forEach(function (bu) {
      const option = document.createElement("option");
      option.value = bu.idbusinessunit;
      option.textContent = bu.nombre;
      buSelect.appendChild(option);
    });

  // ======================================================
  // PRODUCTION LINES
  // ======================================================
  function cargarProductionLinesPorBU(businessUnitId) {
    lineSelect.innerHTML = "";

    const optionLineDefault = document.createElement("option");
    optionLineDefault.value = "";
    optionLineDefault.textContent = "Select a Production Line";
    lineSelect.appendChild(optionLineDefault);

    if (!businessUnitId) {
      lineSelect.disabled = true;
      return;
    }

    const lines = productionLines
      .filter(function (pl) {
        return String(pl.idbusinessunit) === String(businessUnitId);
      })
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")));

    lines.forEach(function (pl) {
      const option = document.createElement("option");
      option.value = pl.idproductionline;
      option.textContent = pl.nombre;
      lineSelect.appendChild(option);
    });

    lineSelect.disabled = false;
  }

  buSelect.addEventListener("change", function () {
    cargarProductionLinesPorBU(this.value);
  });

  cargarProductionLinesPorBU("");

  // ======================================================
  // REVIEWER = USUARIO LOGUEADO
  // ======================================================
  const currentUser = getCurrentUserSeguro();

  reviewerSelect.innerHTML = "";

  if (currentUser) {
    const currentUserId =
      currentUser.id ||
      currentUser.idusuario ||
      currentUser.IdUsuario ||
      "";

    const currentUserName =
      currentUser.nombre ||
      currentUser.name ||
      currentUser.username ||
      currentUser.usuario ||
      "Usuario";

    const optionReviewer = document.createElement("option");
    optionReviewer.value = currentUserId;
    optionReviewer.textContent = currentUserName;
    optionReviewer.selected = true;

    reviewerSelect.appendChild(optionReviewer);
    reviewerSelect.disabled = true;
  } else {
    const optionReviewer = document.createElement("option");
    optionReviewer.value = "";
    optionReviewer.textContent = "No reviewer available";

    reviewerSelect.appendChild(optionReviewer);
    reviewerSelect.disabled = true;
  }
}

// ======================================================
// DATOS INICIALES DEL REVIEW
// ======================================================
document.addEventListener("DOMContentLoaded", async function () {
  await cargarCatalogosAuditoria();

  const inputFecha = document.getElementById("assessmentDate");

  if (inputFecha) {
    inputFecha.value = getFechaLocalSoloFecha();
  }

  const btn = document.getElementById("btnStart");
  if (!btn) return;

  btn.addEventListener("click", function () {
    const bu = document.getElementById("businessUnit");
    const line = document.getElementById("productionLine");
    const reviewer = document.getElementById("reviewerSelect");
    const date = document.getElementById("assessmentDate");

    let valid = true;

    function validate(field) {
      if (!field) {
        valid = false;
        return;
      }

      const value = field.value;

      if (
        !value ||
        value === "" ||
        value.includes("Select") ||
        value.includes("Open")
      ) {
        field.classList.add("is-invalid");
        valid = false;
      } else {
        field.classList.remove("is-invalid");
      }
    }

    validate(bu);
    validate(line);
    validate(reviewer);
    validate(date);

    if (!valid) return;

    const reviewerOption = reviewer.options[reviewer.selectedIndex];
    const buOption = bu.options[bu.selectedIndex];
    const lineOption = line.options[line.selectedIndex];

    const datosIniciales = {
      IdUsuario: reviewer.value,
      IdBusinessUnit: bu.value,
      IdProductionLine: line.value,

      NombreUsuario: reviewerOption ? reviewerOption.textContent.trim() : "",
      NombreBusinessUnit: buOption ? buOption.textContent.trim() : "",
      NombreProductionLine: lineOption ? lineOption.textContent.trim() : "",

      FechaReview: date.value
    };

    localStorage.removeItem("modulos");
    localStorage.setItem("reviewInfo", JSON.stringify(datosIniciales));

    window.location.href = "Manufacturing_Evaluation.html";
  });
});

// ======================================================
// VALIDAR PREGUNTAS POR MÓDULO
// ======================================================
function validarPreguntas(destino, preguntas, idModulo) {
  let valid = true;
  const respuestasModulo = [];

  preguntas.forEach(num => {
    const radios = document.getElementsByName("pregunta" + num);
    const error = document.getElementById("error_pregunta" + num);
    const comentario = document.getElementById("comentario" + num)?.value || "";

    let seleccionado = false;
    let puntuacion = null;

    radios.forEach(r => {
      if (r.checked) {
        seleccionado = true;
        puntuacion = parseInt(r.value, 10);
      }
    });

    if (!seleccionado) {
      if (error) error.style.display = "block";
      valid = false;
    } else {
      if (error) error.style.display = "none";
    }

    respuestasModulo.push({
      IdPregunta: num,
      Puntuacion: puntuacion,
      Comentario: comentario
    });
  });

  if (!valid) return false;

  let modulos = JSON.parse(localStorage.getItem("modulos") || "[]");

  const nombreModulo =
    document.getElementById("moduloNombre")?.textContent ||
    `Módulo ${idModulo}`;

  modulos = modulos.filter(m => Number(m.IdModulo) !== Number(idModulo));

  modulos.push({
    IdModulo: idModulo,
    Nombre: nombreModulo,
    respuestas: respuestasModulo
  });

  localStorage.setItem("modulos", JSON.stringify(modulos));

  if (destino) {
    window.location.href = destino;
  }

  return true;
}

window.validarPreguntas = validarPreguntas;

// ======================================================
// VALIDAR ÚLTIMO MÓDULO + GUARDAR REVIEW
// ======================================================
function validarPreguntasFinal(preguntas, idModulo) {
  const ok = validarPreguntas(null, preguntas, idModulo);
  if (!ok) return;

  const modulos = JSON.parse(localStorage.getItem("modulos") || "[]");

  console.log("Módulos guardados:", modulos);
  console.log("Cantidad de módulos:", modulos.length);

  if (modulos.length < 6) {
    alert(`Aún no están completos los 6 módulos. Actualmente hay ${modulos.length}.`);
    return;
  }

  guardarReview();
}

window.validarPreguntasFinal = validarPreguntasFinal;

// ======================================================
// BOTÓN DEMO
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
  const btnDemo = document.getElementById("btnDemo");

  if (!btnDemo) return;

  btnDemo.addEventListener("click", function () {
    const radios = document.querySelectorAll('input[type="radio"]');

    radios.forEach(r => {
      if (r.value === "3") r.checked = true;
    });

    const comentarios = document.querySelectorAll("textarea");

    comentarios.forEach(t => {
      t.value = "...";
    });

    const errores = document.querySelectorAll(".error-msg");

    errores.forEach(e => {
      e.style.display = "none";
    });

    const invalids = document.querySelectorAll(".is-invalid");

    invalids.forEach(i => {
      i.classList.remove("is-invalid");
    });

    console.log("Formulario autollenado para demo.");
  });
});

// ======================================================
// MENSAJE DE ÉXITO
// ======================================================
function mostrarMensajeExito() {
  const mensaje = document.getElementById("mensajeExito");

  if (!mensaje) {
    console.error("No existe #mensajeExito en el HTML.");
    alert("Mensaje entregado con éxito");
    window.location.href = "index.html";
    return;
  }

  mensaje.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function cerrarMensajeExito() {
  const mensaje = document.getElementById("mensajeExito");

  if (mensaje) {
    mensaje.style.display = "none";
  }

  document.body.style.overflow = "";
}

function cerrarMensajeExitoYRedirigir() {
  const mensaje = document.getElementById("mensajeExito");

  if (mensaje) {
    mensaje.style.display = "none";
  }

  document.body.style.overflow = "";
  window.location.href = "index.html";
}

window.mostrarMensajeExito = mostrarMensajeExito;
window.cerrarMensajeExito = cerrarMensajeExito;
window.cerrarMensajeExitoYRedirigir = cerrarMensajeExitoYRedirigir;

// ======================================================
// GUARDAR REVIEW COMPLETO
// ======================================================
async function guardarReview() {
  const info = JSON.parse(localStorage.getItem("reviewInfo"));
  const modulos = JSON.parse(localStorage.getItem("modulos"));

  console.log("reviewInfo:", info);
  console.log("modulos:", modulos);

  if (!info) {
    alert("Error: No se encontraron los datos iniciales (reviewInfo).");
    return;
  }

  if (!modulos || modulos.length === 0) {
    alert("Error: No se encontraron módulos para guardar.");
    return;
  }

  const respuestas = modulos.flatMap(m => m.respuestas);

  const data = {
    IdUsuario: info.IdUsuario,
    IdBusinessUnit: info.IdBusinessUnit,
    IdProductionLine: info.IdProductionLine,

    NombreUsuario: info.NombreUsuario || "",
    NombreBusinessUnit: info.NombreBusinessUnit || "",
    NombreProductionLine: info.NombreProductionLine || "",

    FechaReview: getFechaHoraLocal(),

    respuestas: respuestas
  };

  console.log("Enviando al backend:", data);

  try {
    const res = await fetch(`${API_BASE}/reviews/guardar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const text = await res.text();
    let json = {};

    try {
      json = JSON.parse(text);
    } catch {
      json = {
        ok: false,
        error: text
      };
    }

    console.log("Respuesta HTTP:", res.status);
    console.log("Respuesta servidor:", json);

    if (res.ok && json.ok) {
      localStorage.removeItem("modulos");
      localStorage.removeItem("reviewInfo");

      const mensaje = document.getElementById("mensajeExito");

      if (!mensaje) {
        console.error("No existe #mensajeExito en el HTML.");
        alert("La auditoría se guardó, pero no se encontró el modal.");
        return;
      }

      mensaje.style.display = "flex";
      document.body.style.overflow = "hidden";
    } else {
      alert(
        "No se pudo guardar el review.\n\n" +
        (json.error || json.message || "El backend rechazó la solicitud.")
      );
    }
  } catch (error) {
    console.error("Error al guardar review:", error);
    alert("Error de conexión con el servidor.");
  }
}

window.guardarReview = guardarReview;

// ======================================================
// MODAL NUEVO PARA .module-card
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
  const moduleCards = document.querySelectorAll(".module-card");
  const modalBackdrop = document.getElementById("moduleModalBackdrop");
  const modalTitle = document.getElementById("moduleModalTitle");
  const modalImage = document.getElementById("moduleModalImage");
  const modalDescription = document.getElementById("moduleModalDescription");
  const modalList = document.getElementById("moduleModalList");
  const closeModalX = document.getElementById("closeModalX");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const goModuleBtn = document.getElementById("goModuleBtn");

  if (!modalBackdrop || !modalTitle || !modalDescription || !modalList) {
    return;
  }

  let currentModuleTitle = "";

  moduleCards.forEach(card => {
    card.addEventListener("click", function () {
      openModuleModal(card);
    });

    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModuleModal(card);
      }
    });
  });

  function openModuleModal(card) {
    currentModuleTitle = card.dataset.title || "Módulo";

    modalTitle.textContent = currentModuleTitle;
    modalDescription.textContent = card.dataset.description || "Sin descripción.";

    if (modalImage) {
      modalImage.src = card.dataset.image || "";
      modalImage.alt = currentModuleTitle;
    }

    modalList.innerHTML = "";

    try {
      const items = JSON.parse(card.dataset.list || "[]");

      items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        modalList.appendChild(li);
      });
    } catch (error) {
      console.error("Error al leer data-list:", error);
    }

    modalBackdrop.classList.add("show");
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModuleModal() {
    modalBackdrop.classList.remove("show");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (closeModalX) {
    closeModalX.addEventListener("click", closeModuleModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModuleModal);
  }

  modalBackdrop.addEventListener("click", function (e) {
    if (e.target === modalBackdrop) {
      closeModuleModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModuleModal();
    }
  });

  if (goModuleBtn) {
    goModuleBtn.addEventListener("click", function () {
      alert(`Continuar con: ${currentModuleTitle}`);
      closeModuleModal();
    });
  }
});

// ======================================================
// CUESTIONARIO DINÁMICO DESDE BASE DE DATOS
// ======================================================
const MODULE_PAGE_CONFIG = {
  "manufacturing_evaluation.html": {
    moduleId: 1,
    moduleName: "Manufacturing Strategy",
    questionStart: 1,
    questionEnd: 8,
    nextPage: "Lean_Foundations.html",
    isFinal: false
  },

  "lean_foundations.html": {
    moduleId: 2,
    moduleName: "Foundations",
    questionStart: 9,
    questionEnd: 16,
    nextPage: "High_Performance_Teams.html",
    isFinal: false
  },

  "high_performance_teams.html": {
    moduleId: 3,
    moduleName: "High Performance Teams",
    questionStart: 17,
    questionEnd: 17,
    nextPage: "Quality_At_Source.html",
    isFinal: false
  },

  "quality_at_source.html": {
    moduleId: 4,
    moduleName: "Quality at Source",
    questionStart: 18,
    questionEnd: 21,
    nextPage: "Safety_First.html",
    isFinal: false
  },

  "safety_first.html": {
    moduleId: 5,
    moduleName: "Safety First",
    questionStart: 22,
    questionEnd: 25,
    nextPage: "Design_Improvement.html",
    isFinal: false
  },

  "design_improvement.html": {
    moduleId: 6,
    moduleName: "Design Improvement",
    questionStart: 26,
    questionEnd: 27,
    nextPage: "",
    isFinal: true
  }
};

async function obtenerPreguntasDesdeBD() {
  console.log("Intentando cargar preguntas desde /api/preguntas...");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_BASE}/api/preguntas?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeout);

    console.log("Status /api/preguntas:", res.status);

    const text = await res.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(text || "La respuesta de preguntas no es JSON válido.");
    }

    if (!res.ok) {
      throw new Error(
        data.error ||
        data.message ||
        `No se pudieron cargar las preguntas. HTTP ${res.status}`
      );
    }

    console.log("Respuesta cruda preguntas:", data);

    if (!Array.isArray(data)) {
      throw new Error("La respuesta de preguntas no es un arreglo.");
    }

    return data;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function normalizarPreguntaBD(q) {
  return {
    idpregunta:
      q.idpregunta ??
      q.idPregunta ??
      q.IdPregunta ??
      q.id ??
      null,

    texto: String(
      q.texto ??
      q.text ??
      q.pregunta ??
      q.descripcion ??
      ""
    ).trim(),

    idmodulo: String(
      q.idmodulo ??
      q.idModulo ??
      q.IdModulo ??
      q.moduleId ??
      q.idModuloPregunta ??
      ""
    ).trim(),

    modulo: String(
      q.modulo ??
      q.module ??
      q.nombre_modulo ??
      q.nombreModulo ??
      q.NombreModulo ??
      ""
    ).trim(),

    orden: Number(
      q.orden ??
      q.order ??
      q.numeroPregunta ??
      q.numero_pregunta ??
      q.numero ??
      0
    )
  };
}

function escapeHTMLDynamic(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function crearPreguntaHTML(pregunta) {
  const numero = Number(pregunta.numeroGlobal);
  const texto = pregunta.texto || `Pregunta ${numero}`;

  return `
    <div class="question-card" data-question-card="${numero}">
      <div class="question-header">
        <div class="question-number">${numero}</div>

        <div class="question-body">
          <h3 class="question-title" data-question-order="${numero}">
            ${escapeHTMLDynamic(texto)}
          </h3>

          <div class="score-options">
            <label class="score-pill score-0" for="pregunta${numero}_0">
              <input class="score-input" type="radio" name="pregunta${numero}" id="pregunta${numero}_0" value="0">
              <span class="score-value">0</span>
              <span class="score-label">Nulo</span>
            </label>

            <label class="score-pill score-1" for="pregunta${numero}_1">
              <input class="score-input" type="radio" name="pregunta${numero}" id="pregunta${numero}_1" value="1">
              <span class="score-value">1</span>
              <span class="score-label">Bajo</span>
            </label>

            <label class="score-pill score-2" for="pregunta${numero}_2">
              <input class="score-input" type="radio" name="pregunta${numero}" id="pregunta${numero}_2" value="2">
              <span class="score-value">2</span>
              <span class="score-label">Medio</span>
            </label>

            <label class="score-pill score-3" for="pregunta${numero}_3">
              <input class="score-input" type="radio" name="pregunta${numero}" id="pregunta${numero}_3" value="3">
              <span class="score-value">3</span>
              <span class="score-label">Alto</span>
            </label>
          </div>

          <div id="error_pregunta${numero}" class="text-danger error-msg" style="display:none;">
            Debes seleccionar una opción.
          </div>
        </div>
      </div>

      <div class="question-comment-wrap">
        <label for="comentario${numero}" class="form-label">Comentarios</label>

        <textarea
          id="comentario${numero}"
          class="form-control question-comment"
          rows="4"
          placeholder="Escribe observaciones, ejemplos o evidencia..."
        ></textarea>
      </div>
    </div>
  `;
}

function obtenerConfigModuloActual() {
  const pathname = window.location.pathname.split("/").pop().toLowerCase();
  const container = document.getElementById("questionsContainer");

  if (container) {
    return {
      moduleId: Number(container.dataset.moduleId || 0),
      moduleName: String(container.dataset.moduleName || "").trim(),
      questionStart: Number(container.dataset.questionStart || 0),
      questionEnd: Number(container.dataset.questionEnd || 0),
      nextPage: String(container.dataset.nextPage || "").trim(),
      isFinal: String(container.dataset.final || "").toLowerCase() === "true"
    };
  }

  return MODULE_PAGE_CONFIG[pathname] || null;
}

function prepararContenedorPreguntasDinamicas() {
  let container = document.getElementById("questionsContainer");

  if (container) {
    return container;
  }

  const wrapper = document.querySelector(".evaluation-wrapper");
  if (!wrapper) return null;

  const actions = wrapper.querySelector(".evaluation-actions");

  wrapper.querySelectorAll(".question-card").forEach(card => {
    card.remove();
  });

  container = document.createElement("div");
  container.id = "questionsContainer";

  if (actions) {
    wrapper.insertBefore(container, actions);
  } else {
    wrapper.appendChild(container);
  }

  return container;
}

async function inicializarCuestionarioDinamico() {
  console.log("Inicializando cuestionario dinámico...");

  const configModulo = obtenerConfigModuloActual();

  if (!configModulo) {
    console.log("Esta página no usa cuestionario dinámico.");
    return;
  }

  const container = prepararContenedorPreguntasDinamicas();

  if (!container) {
    console.error("No existe .evaluation-wrapper ni #questionsContainer.");
    return;
  }

  const moduleId = Number(configModulo.moduleId);
  const moduleName = String(configModulo.moduleName || "").toLowerCase().trim();
  const questionStart = Number(configModulo.questionStart);
  const questionEnd = Number(configModulo.questionEnd);
  const nextPage = String(configModulo.nextPage || "").trim();
  const isFinal = Boolean(configModulo.isFinal);

  console.log("Config módulo:", {
    moduleId,
    moduleName,
    questionStart,
    questionEnd,
    nextPage,
    isFinal
  });

  if (!moduleId || !questionStart || !questionEnd) {
    container.innerHTML = `
      <div class="alert alert-danger">
        Configuración incompleta del módulo dinámico.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="alert alert-light border">
      Cargando preguntas actualizadas...
    </div>
  `;

  try {
    const preguntasBD = await obtenerPreguntasDesdeBD();

    const preguntasNormalizadas = preguntasBD.map(normalizarPreguntaBD);

    let preguntasDelModulo = preguntasNormalizadas.filter(p => {
      return String(p.idmodulo) === String(moduleId);
    });

    if (!preguntasDelModulo.length && moduleName) {
      preguntasDelModulo = preguntasNormalizadas.filter(p => {
        const nombreModulo = String(p.modulo || "").toLowerCase().trim();
        return nombreModulo === moduleName;
      });
    }

    if (!preguntasDelModulo.length) {
      preguntasDelModulo = preguntasNormalizadas.filter(p => {
        const orden = Number(p.orden);
        return orden >= questionStart && orden <= questionEnd;
      });
    }

    preguntasDelModulo = preguntasDelModulo
      .filter(p => p.texto)
      .sort((a, b) => {
        const ordenA = Number(a.orden || a.idpregunta || 0);
        const ordenB = Number(b.orden || b.idpregunta || 0);
        return ordenA - ordenB;
      });

    const preguntasNormalizadasFinal = preguntasDelModulo.map((p, index) => {
      return {
        ...p,
        numeroGlobal: questionStart + index
      };
    });

    console.log("Preguntas filtradas para este módulo:", preguntasNormalizadasFinal);

    if (!preguntasNormalizadasFinal.length) {
      container.innerHTML = `
        <div class="alert alert-warning">
          No se encontraron preguntas para este módulo.<br>
          Módulo esperado: ${moduleId}<br>
          Rango esperado: ${questionStart} a ${questionEnd}<br>
          Revisa que las preguntas tengan idmodulo=${moduleId} o nombre de módulo correcto.
        </div>
      `;
      return;
    }

    container.innerHTML = preguntasNormalizadasFinal
      .map(crearPreguntaHTML)
      .join("");

    const numerosPreguntas = preguntasNormalizadasFinal.map(p =>
      Number(p.numeroGlobal)
    );

    let btnNext = document.getElementById("btnNextModule");

    if (!btnNext) {
      btnNext = document.querySelector(".evaluation-actions .btn-primary");

      if (btnNext) {
        btnNext.id = "btnNextModule";
      }
    }

    if (btnNext) {
      btnNext.removeAttribute("onclick");

      btnNext.onclick = function () {
        if (isFinal) {
          validarPreguntasFinal(numerosPreguntas, moduleId);
        } else {
          validarPreguntas(nextPage, numerosPreguntas, moduleId);
        }
      };
    }

    console.log("Cuestionario dinámico cargado correctamente.");
  } catch (error) {
    console.error("Error cargando cuestionario dinámico:", error);

    container.innerHTML = `
      <div class="alert alert-danger">
        No se pudieron cargar las preguntas actualizadas desde la base de datos.<br>
        <small>${escapeHTMLDynamic(error.message)}</small>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  inicializarCuestionarioDinamico();
});
document.addEventListener("DOMContentLoaded", async function () {
  const API_BASE = "";
  const API_ACTION_PLANS = `${API_BASE}/api/action-plans`;

  // ======================================================
  // ELEMENTOS PRINCIPALES
  // ======================================================
  const tablaBody = document.getElementById("tablaActionPlanBody");

  const filtroEstado = document.getElementById("filtroEstado");
  const filtroBusinessUnit = document.getElementById("filtroBusinessUnit");
  const filtroTexto = document.getElementById("filtroTexto");
  const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

  const btnExportarActionPlan = document.getElementById("btnExportarActionPlan");

  // ======================================================
  // STATUS CARDS
  // ======================================================
  const statusCards = document.querySelectorAll(".action-status-card");

  const countTodos = document.getElementById("countTodos");
  const countAbiertos = document.getElementById("countAbiertos");
  const countVencidos = document.getElementById("countVencidos");
  const countCerrados = document.getElementById("countCerrados");

  // ======================================================
  // FORMULARIO / MODAL
  // ======================================================
  const btnGuardarHallazgo = document.getElementById("btnGuardarHallazgo");

  const hallazgoId = document.getElementById("hallazgoId");
  const hallazgoFecha = document.getElementById("hallazgoFecha");
  const hallazgoBusinessUnit = document.getElementById("hallazgoBusinessUnit");
  const hallazgoProductionLine = document.getElementById("hallazgoProductionLine");
  const hallazgoModulo = document.getElementById("hallazgoModulo");
  const hallazgoPregunta = document.getElementById("hallazgoPregunta");
  const preguntaPreview = document.getElementById("preguntaPreview");
  const hallazgoAccion = document.getElementById("hallazgoAccion");
  const hallazgoResponsable = document.getElementById("hallazgoResponsable");
  const hallazgoFechaCompromiso = document.getElementById("hallazgoFechaCompromiso");
  const hallazgoFechaCierre = document.getElementById("hallazgoFechaCierre");
  const hallazgoEstado = document.getElementById("hallazgoEstado");

  const modalEl = document.getElementById("modalHallazgo");
  const modal = modalEl ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;

  // ======================================================
  // RESPONSABLES DESDE BASE DE DATOS
  // ======================================================
  let responsablesActionPlan = [];

  // ======================================================
  // PARÁMETROS URL
  // ======================================================
  const params = new URLSearchParams(window.location.search);
  const buParam = params.get("bu");
  const plParam = params.get("pl");

  const actionPlanSubtitle = document.getElementById("actionPlanSubtitle");

  if (actionPlanSubtitle) {
    if (buParam && plParam) {
      actionPlanSubtitle.textContent = `Plan de acción para ${buParam} / ${plParam}.`;
    } else if (buParam) {
      actionPlanSubtitle.textContent = `Plan de acción para Business Unit: ${buParam}.`;
    } else {
      actionPlanSubtitle.textContent =
        "Seguimiento de hallazgos, responsables, fechas compromiso y estatus.";
    }
  }

  // ======================================================
  // CACHES
  // ======================================================
  let preguntasCache = [];
  let businessUnitsCache = [];
  let productionLinesCache = [];
  let actionPlanItemsCache = [];

  const MODULES_BY_ID = {
    "1": "Manufacturing Strategy",
    "2": "Foundations",
    "3": "High Performance Teams",
    "4": "Quality at Source",
    "5": "Safety First",
    "6": "Design Improvement"
  };

  // ======================================================
  // HELPERS
  // ======================================================
  function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

  function getToday() {
    const d = new Date();

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  function convertirFecha(value) {
    if (!value) return "";

    const texto = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
      return texto.slice(0, 10);
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(texto)) {
      const parts = texto.split("/");
      const mm = String(parts[0]).padStart(2, "0");
      const dd = String(parts[1]).padStart(2, "0");
      const yyyy = parts[2];

      return `${yyyy}-${mm}-${dd}`;
    }

    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(texto)) {
      const parts = texto.split("-");
      const mm = String(parts[0]).padStart(2, "0");
      const dd = String(parts[1]).padStart(2, "0");
      const yyyy = parts[2];

      return `${yyyy}-${mm}-${dd}`;
    }

    return "";
  }

  function formatDate(date) {
    if (!date) return "";

    const cleanDate = convertirFecha(date);
    const parts = cleanDate.split("-");

    if (parts.length !== 3) return date;

    return `${Number(parts[1])}/${Number(parts[2])}/${parts[0]}`;
  }

  function parseDateOnly(dateValue) {
    if (!dateValue) return null;

    const cleanDate = convertirFecha(dateValue);
    const parts = cleanDate.split("-");

    if (parts.length !== 3) return null;

    const yyyy = Number(parts[0]);
    const mm = Number(parts[1]) - 1;
    const dd = Number(parts[2]);

    const d = new Date(yyyy, mm, dd);
    d.setHours(0, 0, 0, 0);

    if (isNaN(d.getTime())) return null;

    return d;
  }

  function normalizarTexto(value) {
    return String(value || "").toLowerCase().trim();
  }

  function getUsuarioSesionActionPlan() {
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

  function getUsuarioActualActionPlan() {
    const currentUser = getUsuarioSesionActionPlan();

    if (!currentUser) return "Usuario";

    return (
      currentUser.name ||
      currentUser.nombre ||
      currentUser.username ||
      currentUser.usuario ||
      "Usuario"
    );
  }

  function getUsuarioActualIdActionPlan() {
    const currentUser = getUsuarioSesionActionPlan();

    if (!currentUser) return "";

    return String(
      currentUser.id ||
      currentUser.idusuario ||
      currentUser.idUsuario ||
      currentUser.IdUsuario ||
      ""
    );
  }

  function getRolUsuarioActionPlan() {
    const user = getUsuarioSesionActionPlan();

    if (!user) return "";

    return String(
      user.role ||
      user.rol ||
      user.tipo ||
      user.perfil ||
      ""
    ).trim();
  }

  function esAdminActionPlan() {
    const role = getRolUsuarioActionPlan().toUpperCase();

    return (
      role === "ADMIN" ||
      role === "ADMINISTRADOR" ||
      role === "ADMINISTRATOR"
    );
  }

  function calcularEstadoAutomatico(fechaCompromiso, fechaCierre, estadoManual) {
    const compromiso = parseDateOnly(fechaCompromiso);
    const cierre = parseDateOnly(fechaCierre);
    const hoy = parseDateOnly(getToday());

    if (cierre) {
      return "CERRADO";
    }

    if (compromiso && hoy && compromiso < hoy) {
      return "VENCIDO";
    }

    const estado = String(estadoManual || "").toUpperCase();

    if (estado === "CERRADO") {
      return "CERRADO";
    }

    return "ABIERTO";
  }

  function getEstadoClass(estado) {
    const e = String(estado || "").toUpperCase();

    if (e === "VENCIDO") return "estado-vencido";
    if (e === "CERRADO") return "estado-cerrado";

    return "estado-abierto";
  }

  function actualizarPreviewPregunta(texto) {
    if (!preguntaPreview) return;

    preguntaPreview.textContent =
      texto || "Selecciona una pregunta para ver el texto completo.";
  }

  // ======================================================
  // RESPONSABLES DESDE AZURE SQL
  // ======================================================
  async function cargarResponsablesActionPlan() {
    responsablesActionPlan = [];

    try {
      const res = await fetch(`${API_BASE}/api/usuarios?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await res.json().catch(() => ({}));

      console.log("Respuesta /api/usuarios responsables:", {
        status: res.status,
        ok: res.ok,
        data
      });

      if (!res.ok) {
        throw new Error(
          data.detalle ||
          data.error ||
          data.message ||
          `Error HTTP ${res.status} cargando responsables.`
        );
      }

      const usuarios = Array.isArray(data)
        ? data
        : Array.isArray(data.usuarios)
          ? data.usuarios
          : Array.isArray(data.users)
            ? data.users
            : Array.isArray(data.data)
              ? data.data
              : [];

      responsablesActionPlan = usuarios
        .filter((u) => {
          const activo =
            u.activo ??
            u.Activo ??
            u.active ??
            u.isActive ??
            1;

          return (
            String(activo) === "1" ||
            activo === true ||
            String(activo).toLowerCase() === "true"
          );
        })
        .map((u) => {
          return String(
            u.nombre ??
            u.Nombre ??
            u.name ??
            u.Name ??
            u.usuario ??
            u.Usuario ??
            u.username ??
            ""
          ).trim();
        })
        .filter((nombre) => nombre !== "");

      responsablesActionPlan = [...new Set(responsablesActionPlan)]
        .sort((a, b) => a.localeCompare(b, "es"));

      console.log("Responsables cargados desde Azure SQL:", responsablesActionPlan);

      llenarListaResponsables();
    } catch (error) {
      console.error("Error cargando responsables desde Azure SQL:", error);

      responsablesActionPlan = [];
      llenarListaResponsables();

      alert("No se pudieron cargar los responsables desde la base de datos.");
    }
  }

  function llenarListaResponsables() {
    const datalist = document.getElementById("listaResponsables");

    if (!datalist) return;

    if (!responsablesActionPlan.length) {
      datalist.innerHTML = "";
      return;
    }

    datalist.innerHTML = responsablesActionPlan
      .map((nombre) => `<option value="${escapeHTML(nombre)}"></option>`)
      .join("");
  }

  // ======================================================
  // NORMALIZAR ACTION PLAN DESDE BACKEND
  // ======================================================
  function normalizarActionPlanBackend(item) {
    const fechaCompromiso = convertirFecha(
      item.fechaCompromiso ||
      item.fechacompromiso ||
      item.fecha_compromiso ||
      ""
    );

    const fechaCierre = convertirFecha(
      item.fechaCierre ||
      item.fechacierre ||
      item.fecha_cierre ||
      ""
    );

    const estadoCalculado = calcularEstadoAutomatico(
      fechaCompromiso,
      fechaCierre,
      item.estado || "ABIERTO"
    );

    return {
      id:
        item.id ||
        item.idActionPlan ||
        item.id_action_plan ||
        item.idaccion ||
        "",

      fecha: convertirFecha(item.fecha),

      creadoPor:
        item.creadoPor ||
        item.creado_por ||
        item.createdBy ||
        item.usuarioCreador ||
        item.creador ||
        "Usuario",

      creadoPorId:
        item.creadoPorId ||
        item.idUsuario ||
        item.id_usuario ||
        "",

      idBusinessUnit:
        item.idBusinessUnit ||
        item.id_business_unit ||
        item.idbusinessunit ||
        "",

      businessUnit:
        item.businessUnit ||
        item.business_unit ||
        item.BusinessUnit ||
        item.bu ||
        "",

      idProductionLine:
        item.idProductionLine ||
        item.id_production_line ||
        item.idproductionline ||
        "",

      productionLine:
        item.productionLine ||
        item.production_line ||
        item.ProductionLine ||
        item.area ||
        "",

      idModulo:
        item.idModulo ||
        item.id_modulo ||
        item.idmodulo ||
        "",

      modulo:
        item.modulo ||
        MODULES_BY_ID[String(item.idModulo || item.id_modulo || item.idmodulo || "")] ||
        item.kpi ||
        "",

      idPregunta:
        item.idPregunta ||
        item.id_pregunta ||
        item.idpregunta ||
        "",

      pregunta:
        item.pregunta ||
        item.descripcion ||
        "",

      accionRequerida:
        item.accionRequerida ||
        item.accion_requerida ||
        item.accion ||
        item.acciones ||
        "",

      responsable:
        item.responsable ||
        "",

      fechaCompromiso,
      fechaCierre,

      estado: estadoCalculado
    };
  }

  function convertirActionPlanParaBackend(item) {
    return {
      fecha: item.fecha || null,

      creadoPor: item.creadoPor || getUsuarioActualActionPlan(),
      creadoPorId: item.creadoPorId || getUsuarioActualIdActionPlan(),

      idBusinessUnit: item.idBusinessUnit || null,
      businessUnit: item.businessUnit || "",

      idProductionLine: item.idProductionLine || null,
      productionLine: item.productionLine || "",

      idModulo: item.idModulo || "",
      modulo: item.modulo || "",

      idPregunta: item.idPregunta || "",
      pregunta: item.pregunta || "",

      accionRequerida: item.accionRequerida || "",
      responsable: item.responsable || "",

      fechaCompromiso: item.fechaCompromiso || null,
      fechaCierre: item.fechaCierre || null,

      estado: item.estado || "ABIERTO"
    };
  }

  // ======================================================
  // CATÁLOGOS DESDE AZURE SQL
  // ======================================================
  function normalizarBusinessUnit(bu) {
    return {
      id: String(
        bu.id ||
        bu.idbusinessunit ||
        bu.IdBusinessUnit ||
        bu.idBusinessUnit ||
        bu.businessUnitId ||
        ""
      ),

      nombre: String(
        bu.nombre ||
        bu.name ||
        bu.NombreBusinessUnit ||
        bu.businessUnit ||
        ""
      ).trim()
    };
  }

  function normalizarProductionLine(pl) {
    return {
      id: String(
        pl.id ||
        pl.idproductionline ||
        pl.IdProductionLine ||
        pl.idProductionLine ||
        pl.productionLineId ||
        ""
      ),

      nombre: String(
        pl.nombre ||
        pl.name ||
        pl.NombreProductionLine ||
        pl.productionLine ||
        ""
      ).trim(),

      idBusinessUnit: String(
        pl.idbusinessunit ||
        pl.IdBusinessUnit ||
        pl.idBusinessUnit ||
        pl.businessUnitId ||
        pl.idbu ||
        ""
      )
    };
  }

  async function cargarCatalogosDesdeBD() {
    try {
      const res = await fetch(`${API_BASE}/api/catalogos?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store"
      });

      const data = await res.json().catch(() => ({}));

      console.log("Respuesta /api/catalogos ActionPlan:", {
        status: res.status,
        ok: res.ok,
        data
      });

      if (!res.ok || data.ok === false) {
        throw new Error(
          data.detalle ||
          data.error ||
          data.message ||
          "No se pudieron cargar los catálogos."
        );
      }

      businessUnitsCache = Array.isArray(data.businessUnits)
        ? data.businessUnits
            .map(normalizarBusinessUnit)
            .filter(bu => bu.id && bu.nombre)
        : [];

      productionLinesCache = Array.isArray(data.productionLines)
        ? data.productionLines
            .map(normalizarProductionLine)
            .filter(pl => pl.id && pl.nombre)
        : [];

      console.log("Business Units ActionPlan desde BD:", businessUnitsCache);
      console.log("Production Lines ActionPlan desde BD:", productionLinesCache);
    } catch (error) {
      console.error("Error cargando catálogos ActionPlan desde Azure SQL:", error);

      businessUnitsCache = [];
      productionLinesCache = [];

      alert("No se pudieron cargar Business Units y Production Lines desde la base de datos.");
    }
  }

  function llenarBusinessUnitsSelect(valorSeleccionado = "") {
    if (!hallazgoBusinessUnit) return;

    const businessUnitsOrdenadas = [...businessUnitsCache].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );

    hallazgoBusinessUnit.innerHTML = `
      <option value="">Todas / Selecciona Business Unit</option>
      ${businessUnitsOrdenadas
        .map(bu => {
          const selected =
            String(valorSeleccionado).trim().toLowerCase() === String(bu.nombre).trim().toLowerCase() ||
            String(valorSeleccionado) === String(bu.id)
              ? "selected"
              : "";

          return `
            <option
              value="${escapeHTML(bu.nombre)}"
              data-id="${escapeHTML(bu.id)}"
              ${selected}
            >
              ${escapeHTML(bu.nombre)}
            </option>
          `;
        })
        .join("")}
    `;
  }

  function obtenerIdBusinessUnitSeleccionada() {
    if (!hallazgoBusinessUnit) return "";

    const option = hallazgoBusinessUnit.options[hallazgoBusinessUnit.selectedIndex];

    return option?.dataset?.id || "";
  }

  function obtenerIdProductionLineSeleccionada() {
    if (!hallazgoProductionLine) return "";

    const option = hallazgoProductionLine.options[hallazgoProductionLine.selectedIndex];

    return option?.dataset?.id || "";
  }

  function llenarProductionLinesSelect(idBusinessUnit = "", valorSeleccionado = "") {
    if (!hallazgoProductionLine) return;

    let lines = [...productionLinesCache];

    if (idBusinessUnit) {
      lines = lines.filter(pl => String(pl.idBusinessUnit) === String(idBusinessUnit));
    }

    lines = lines.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    if (!lines.length) {
      hallazgoProductionLine.innerHTML = `
        <option value="">No hay Production Lines disponibles</option>
      `;
      hallazgoProductionLine.disabled = false;
      return;
    }

    hallazgoProductionLine.innerHTML = `
      <option value="">Todas / Selecciona Production Line</option>
      ${lines
        .map(pl => {
          const selected =
            String(valorSeleccionado).trim().toLowerCase() === String(pl.nombre).trim().toLowerCase() ||
            String(valorSeleccionado) === String(pl.id)
              ? "selected"
              : "";

          return `
            <option
              value="${escapeHTML(pl.nombre)}"
              data-id="${escapeHTML(pl.id)}"
              data-idbusinessunit="${escapeHTML(pl.idBusinessUnit)}"
              ${selected}
            >
              ${escapeHTML(pl.nombre)}
            </option>
          `;
        })
        .join("")}
    `;

    hallazgoProductionLine.disabled = false;
  }

  // ======================================================
  // MÓDULO Y PREGUNTA
  // ======================================================
  function obtenerNombreModuloSeleccionado() {
    if (!hallazgoModulo) return "";

    const option = hallazgoModulo.options[hallazgoModulo.selectedIndex];

    return option?.dataset?.nombre || option?.textContent?.trim() || "";
  }

  function obtenerTextoPreguntaSeleccionada() {
    if (!hallazgoPregunta) return "";

    const option = hallazgoPregunta.options[hallazgoPregunta.selectedIndex];

    return option?.dataset?.texto || option?.textContent?.trim() || "";
  }

  function normalizarPreguntaBD(q) {
    return {
      idpregunta:
        q.idpregunta ??
        q.idPregunta ??
        q.IdPregunta ??
        q.id ??
        "",

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
        q.idpregunta ??
        q.idPregunta ??
        0
      )
    };
  }

  async function cargarPreguntasDesdeBD() {
    if (preguntasCache.length > 0) {
      return preguntasCache;
    }

    try {
      const res = await fetch(`${API_BASE}/api/preguntas?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store"
      });

      if (!res.ok) {
        throw new Error(`No se pudieron cargar las preguntas. HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("La respuesta de preguntas no es un arreglo.");
      }

      preguntasCache = data.map(normalizarPreguntaBD);

      console.log("Preguntas cargadas para ActionPlan:", preguntasCache);

      return preguntasCache;
    } catch (error) {
      console.error("Error cargando preguntas:", error);
      return [];
    }
  }

  async function cargarPreguntasPorModulo(idModulo, idPreguntaSeleccionada = "") {
    if (!hallazgoPregunta) return;

    actualizarPreviewPregunta("");

    if (!idModulo) {
      hallazgoPregunta.innerHTML = `
        <option value="">Primero selecciona un módulo</option>
      `;
      return;
    }

    hallazgoPregunta.innerHTML = `
      <option value="">Cargando preguntas...</option>
    `;

    const preguntas = await cargarPreguntasDesdeBD();

    const preguntasDelModulo = preguntas
      .filter(p => String(p.idmodulo) === String(idModulo))
      .filter(p => p.texto)
      .sort((a, b) => Number(a.orden) - Number(b.orden));

    if (!preguntasDelModulo.length) {
      hallazgoPregunta.innerHTML = `
        <option value="">No hay preguntas relacionadas a este módulo</option>
      `;
      actualizarPreviewPregunta("No hay preguntas relacionadas a este módulo.");
      return;
    }

    hallazgoPregunta.innerHTML = `
      <option value="">Selecciona una pregunta</option>
      ${preguntasDelModulo
        .map(p => {
          const selected =
            String(p.idpregunta) === String(idPreguntaSeleccionada)
              ? "selected"
              : "";

          const textoCorto =
            p.texto.length > 85
              ? p.texto.substring(0, 85) + "..."
              : p.texto;

          return `
            <option
              value="${escapeHTML(p.idpregunta)}"
              data-texto="${escapeHTML(p.texto)}"
              title="${escapeHTML(p.texto)}"
              ${selected}
            >
              ${escapeHTML(`${p.orden}. ${textoCorto}`)}
            </option>
          `;
        })
        .join("")}
    `;

    if (idPreguntaSeleccionada) {
      const option = hallazgoPregunta.options[hallazgoPregunta.selectedIndex];
      const textoCompleto = option?.dataset?.texto || "";
      actualizarPreviewPregunta(textoCompleto);
    }
  }

  // ======================================================
  // ACTION PLANS DESDE BACKEND
  // ======================================================
  function getItems() {
    return actionPlanItemsCache.map(normalizarActionPlanBackend);
  }

  async function cargarActionPlansDesdeBD() {
    try {
      if (tablaBody) {
        tablaBody.innerHTML = `
          <tr>
            <td colspan="12" class="text-center text-muted py-4">
              Cargando planes de acción...
            </td>
          </tr>
        `;
      }

      const res = await fetch(`${API_ACTION_PLANS}?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();

      actionPlanItemsCache = Array.isArray(data) ? data : [];

      cargarFiltroBusinessUnit();
      renderTable();
    } catch (error) {
      console.error("Error cargando planes desde BD:", error);

      if (tablaBody) {
        tablaBody.innerHTML = `
          <tr>
            <td colspan="12" class="text-center text-danger py-4">
              Error cargando planes de acción desde la base de datos.
            </td>
          </tr>
        `;
      }
    }
  }

  // ======================================================
  // FILTROS
  // ======================================================
  function cargarFiltroBusinessUnit() {
    if (!filtroBusinessUnit) return;

    const items = getItems();

    const businessUnits = [...new Set(
      items
        .map(item => String(item.businessUnit || "").trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));

    const valorActual = filtroBusinessUnit.value || "";

    filtroBusinessUnit.innerHTML = `
      <option value="">Todos</option>
      ${businessUnits
        .map(bu => {
          const selected = bu === valorActual ? "selected" : "";
          return `<option value="${escapeHTML(bu)}" ${selected}>${escapeHTML(bu)}</option>`;
        })
        .join("")}
    `;
  }

  function filtrarItems(items) {
    const estado = filtroEstado ? filtroEstado.value : "";
    const businessUnit = filtroBusinessUnit ? filtroBusinessUnit.value : "";
    const texto = filtroTexto ? normalizarTexto(filtroTexto.value) : "";

    return items.filter(item => {
      const estadoCalculado = calcularEstadoAutomatico(
        item.fechaCompromiso,
        item.fechaCierre,
        item.estado
      );

      const matchEstado =
        !estado || String(estadoCalculado || "").toUpperCase() === estado;

      const matchBUFiltro =
        !businessUnit || String(item.businessUnit || "") === businessUnit;

      const textoCompleto = normalizarTexto([
        item.fecha,
        item.creadoPor,
        item.businessUnit,
        item.productionLine,
        item.modulo,
        item.pregunta,
        item.accionRequerida,
        item.responsable,
        item.fechaCompromiso,
        item.fechaCierre,
        estadoCalculado
      ].join(" "));

      const matchTexto =
        !texto || textoCompleto.includes(texto);

      const matchBUParam =
        !buParam || String(item.businessUnit || "") === buParam;

      const matchPLParam =
        !plParam || String(item.productionLine || "") === plParam;

      return matchEstado && matchBUFiltro && matchTexto && matchBUParam && matchPLParam;
    });
  }

  // ======================================================
  // CONTADORES
  // ======================================================
  function setStatusCardActive(status) {
    const statusActual = String(status || "").toUpperCase();

    statusCards.forEach(card => {
      const cardStatus = String(card.dataset.status || "").toUpperCase();

      if (cardStatus === statusActual) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
  }

  function getItemsBaseParaContadores() {
    const items = getItems();

    const businessUnit = filtroBusinessUnit ? filtroBusinessUnit.value : "";
    const texto = filtroTexto ? normalizarTexto(filtroTexto.value) : "";

    return items.filter(item => {
      const estadoCalculado = calcularEstadoAutomatico(
        item.fechaCompromiso,
        item.fechaCierre,
        item.estado
      );

      const matchBUFiltro =
        !businessUnit || String(item.businessUnit || "") === businessUnit;

      const textoCompleto = normalizarTexto([
        item.fecha,
        item.creadoPor,
        item.businessUnit,
        item.productionLine,
        item.modulo,
        item.pregunta,
        item.accionRequerida,
        item.responsable,
        item.fechaCompromiso,
        item.fechaCierre,
        estadoCalculado
      ].join(" "));

      const matchTexto =
        !texto || textoCompleto.includes(texto);

      const matchBUParam =
        !buParam || String(item.businessUnit || "") === buParam;

      const matchPLParam =
        !plParam || String(item.productionLine || "") === plParam;

      return matchBUFiltro && matchTexto && matchBUParam && matchPLParam;
    });
  }

  function actualizarContadoresStatus() {
    const itemsBase = getItemsBaseParaContadores();

    let total = itemsBase.length;
    let abiertos = 0;
    let vencidos = 0;
    let cerrados = 0;

    itemsBase.forEach(item => {
      const estadoCalculado = calcularEstadoAutomatico(
        item.fechaCompromiso,
        item.fechaCierre,
        item.estado
      );

      if (estadoCalculado === "ABIERTO") abiertos++;
      if (estadoCalculado === "VENCIDO") vencidos++;
      if (estadoCalculado === "CERRADO") cerrados++;
    });

    if (countTodos) countTodos.textContent = total;
    if (countAbiertos) countAbiertos.textContent = abiertos;
    if (countVencidos) countVencidos.textContent = vencidos;
    if (countCerrados) countCerrados.textContent = cerrados;
  }

  function inicializarStatusCards() {
    statusCards.forEach(card => {
      card.addEventListener("click", function () {
        const status = String(card.dataset.status || "").toUpperCase();

        if (filtroEstado) {
          filtroEstado.value = status;
        }

        setStatusCardActive(status);
        renderTable();
      });
    });
  }

  // ======================================================
  // EXPORTAR EXCEL
  // ======================================================
  function exportarActionPlanExcel() {
    if (typeof XLSX === "undefined") {
      alert("No se encontró la librería de Excel. Agrega SheetJS en el HTML antes de ActionPlan.js.");
      return;
    }

    const items = filtrarItems(getItems());

    if (!items.length) {
      alert("No hay datos para exportar.");
      return;
    }

    const dataExcel = items.map(item => {
      const estadoCalculado = calcularEstadoAutomatico(
        item.fechaCompromiso,
        item.fechaCierre,
        item.estado
      );

      return {
        "Fecha": formatDate(item.fecha),
        "Creado por": item.creadoPor || "Usuario",
        "Business Unit": item.businessUnit || "",
        "Production Line": item.productionLine || "",
        "Módulo": item.modulo || "",
        "Pregunta": item.pregunta || "",
        "Acción Requerida": item.accionRequerida || "",
        "Responsable": item.responsable || "",
        "Fecha Compromiso": formatDate(item.fechaCompromiso),
        "Fecha Cierre": formatDate(item.fechaCierre),
        "Estado": estadoCalculado
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);

    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 24 },
      { wch: 18 },
      { wch: 30 },
      { wch: 24 },
      { wch: 60 },
      { wch: 50 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plan de Acción");

    XLSX.writeFile(workbook, `Plan_de_Accion_${getToday()}.xlsx`);
  }

  // ======================================================
  // RENDER TABLA
  // ======================================================
  function renderTable() {
    if (!tablaBody) return;

    const estadoActual = filtroEstado ? filtroEstado.value : "";

    setStatusCardActive(estadoActual);
    actualizarContadoresStatus();

    const items = filtrarItems(getItems());

    if (!items.length) {
      tablaBody.innerHTML = `
        <tr>
          <td colspan="12" class="text-center text-muted py-4">
            No hay planes de acción registrados.
          </td>
        </tr>
      `;
      return;
    }

    tablaBody.innerHTML = items.map(item => {
      const estadoCalculado = calcularEstadoAutomatico(
        item.fechaCompromiso,
        item.fechaCierre,
        item.estado
      );

      const accionCerrada = Boolean(item.fechaCierre);

      return `
        <tr>
          <td>${escapeHTML(formatDate(item.fecha))}</td>

          <td class="creado-por-cell">
            ${escapeHTML(item.creadoPor || "Usuario")}
          </td>

          <td>${escapeHTML(item.businessUnit)}</td>
          <td>${escapeHTML(item.productionLine)}</td>
          <td>${escapeHTML(item.modulo)}</td>

          <td class="text-wrap-cell">
            ${escapeHTML(item.pregunta)}
          </td>

          <td class="text-wrap-cell">
            ${escapeHTML(item.accionRequerida)}
          </td>

          <td>${escapeHTML(item.responsable)}</td>
          <td>${escapeHTML(formatDate(item.fechaCompromiso))}</td>
          <td>${escapeHTML(formatDate(item.fechaCierre))}</td>

          <td>
            <span class="estado-badge ${getEstadoClass(estadoCalculado)}">
              ${escapeHTML(estadoCalculado)}
            </span>
          </td>

          <td>
            <div class="action-row-buttons">

              ${!accionCerrada ? `
                <button
                  type="button"
                  class="btn btn-sm btn-outline-success"
                  onclick="cerrarAccion('${item.id}')"
                  title="Cerrar Acción"
                >
                  <i class="fa-solid fa-check"></i>
                </button>
              ` : ""}

              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                onclick="editarHallazgo('${item.id}')"
                title="Editar"
              >
                <i class="fa-solid fa-pen"></i>
              </button>

              ${esAdminActionPlan() ? `
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  onclick="eliminarHallazgo('${item.id}')"
                  title="Eliminar"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              ` : ""}

            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ======================================================
  // FORMULARIO
  // ======================================================
  function limpiarFormulario() {
    if (hallazgoId) hallazgoId.value = "";
    if (hallazgoFecha) hallazgoFecha.value = getToday();

    llenarBusinessUnitsSelect(buParam || "");

    const idBUSeleccionada = obtenerIdBusinessUnitSeleccionada();

    llenarProductionLinesSelect(idBUSeleccionada, plParam || "");

    if (hallazgoModulo) hallazgoModulo.value = "";

    if (hallazgoPregunta) {
      hallazgoPregunta.innerHTML = `
        <option value="">Primero selecciona un módulo</option>
      `;
    }

    actualizarPreviewPregunta("");

    if (hallazgoAccion) hallazgoAccion.value = "";
    if (hallazgoResponsable) hallazgoResponsable.value = "";
    if (hallazgoFechaCompromiso) hallazgoFechaCompromiso.value = "";
    if (hallazgoFechaCierre) hallazgoFechaCierre.value = "";

    if (hallazgoEstado) hallazgoEstado.value = "ABIERTO";

    llenarListaResponsables();
  }

  async function guardarHallazgo() {
    const id = hallazgoId ? hallazgoId.value : "";

    const fechaCompromisoValue = hallazgoFechaCompromiso
      ? hallazgoFechaCompromiso.value
      : "";

    const idModuloSeleccionado = hallazgoModulo ? hallazgoModulo.value : "";
    const nombreModuloSeleccionado = obtenerNombreModuloSeleccionado();

    const idPreguntaSeleccionada = hallazgoPregunta ? hallazgoPregunta.value : "";
    const textoPreguntaSeleccionada = obtenerTextoPreguntaSeleccionada();

    const itemAnterior = getItems().find(item => String(item.id) === String(id));
    const esNuevo = !id;

    const fechaCierreReal = esNuevo ? "" : (itemAnterior?.fechaCierre || "");

    const estadoCalculado = calcularEstadoAutomatico(
      fechaCompromisoValue,
      fechaCierreReal,
      esNuevo ? "ABIERTO" : (itemAnterior?.estado || "ABIERTO")
    );

    const nuevo = {
      id: id || "",

      fecha: hallazgoFecha ? hallazgoFecha.value : "",

      creadoPor: esNuevo
        ? getUsuarioActualActionPlan()
        : (itemAnterior?.creadoPor || getUsuarioActualActionPlan()),

      creadoPorId: esNuevo
        ? getUsuarioActualIdActionPlan()
        : (itemAnterior?.creadoPorId || getUsuarioActualIdActionPlan()),

      idBusinessUnit: obtenerIdBusinessUnitSeleccionada(),
      businessUnit: hallazgoBusinessUnit ? hallazgoBusinessUnit.value.trim() : "",

      idProductionLine: obtenerIdProductionLineSeleccionada(),
      productionLine: hallazgoProductionLine ? hallazgoProductionLine.value.trim() : "",

      idModulo: idModuloSeleccionado,
      modulo: nombreModuloSeleccionado,

      idPregunta: idPreguntaSeleccionada,
      pregunta: textoPreguntaSeleccionada,

      accionRequerida: hallazgoAccion ? hallazgoAccion.value.trim() : "",
      responsable: hallazgoResponsable ? hallazgoResponsable.value.trim() : "",

      fechaCompromiso: fechaCompromisoValue,
      fechaCierre: fechaCierreReal,

      estado: estadoCalculado
    };

    if (
      !nuevo.fecha ||
      !nuevo.businessUnit ||
      !nuevo.productionLine ||
      !nuevo.idModulo ||
      !nuevo.idPregunta
    ) {
      alert("Completa al menos Fecha, Business Unit, Production Line, Módulo y Pregunta.");
      return;
    }

    if (!nuevo.accionRequerida) {
      alert("Escribe la acción requerida.");
      return;
    }

    if (!nuevo.responsable) {
      alert("Selecciona o escribe un responsable.");
      return;
    }

    if (!nuevo.fechaCompromiso) {
      alert("Selecciona una fecha compromiso.");
      return;
    }

    const payload = convertirActionPlanParaBackend(nuevo);

    try {
      let url = API_ACTION_PLANS;
      let method = "POST";

      if (id) {
        url = `${API_ACTION_PLANS}/${encodeURIComponent(id)}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let json = {};

      try {
        json = JSON.parse(text);
      } catch {
        json = { ok: false, error: text };
      }

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || json.detalle || `HTTP ${res.status}`);
      }

      if (modalEl) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.hide();
      }

      limpiarFormulario();

      await cargarActionPlansDesdeBD();
    } catch (error) {
      console.error("Error guardando plan en BD:", error);
      alert("No se pudo guardar el plan de acción en la base de datos.");
    }
  }

  window.editarHallazgo = async function (id) {
    const item = getItems().find(x => String(x.id) === String(id));

    if (!item) return;

    if (hallazgoId) hallazgoId.value = item.id || "";
    if (hallazgoFecha) hallazgoFecha.value = item.fecha || "";

    llenarBusinessUnitsSelect(item.idBusinessUnit || item.businessUnit || "");

    const idBUSeleccionada = obtenerIdBusinessUnitSeleccionada();

    llenarProductionLinesSelect(
      idBUSeleccionada,
      item.idProductionLine || item.productionLine || ""
    );

    if (hallazgoModulo) {
      hallazgoModulo.value = item.idModulo || "";
    }

    await cargarPreguntasPorModulo(item.idModulo || "", item.idPregunta || "");

    if (hallazgoAccion) hallazgoAccion.value = item.accionRequerida || "";
    if (hallazgoResponsable) hallazgoResponsable.value = item.responsable || "";
    if (hallazgoFechaCompromiso) hallazgoFechaCompromiso.value = item.fechaCompromiso || "";
    if (hallazgoFechaCierre) hallazgoFechaCierre.value = item.fechaCierre || "";

    if (hallazgoEstado) {
      hallazgoEstado.value = item.estado || "ABIERTO";
    }

    llenarListaResponsables();

    if (modal) modal.show();
  };

  window.cerrarAccion = async function (id) {
    const ok = confirm("¿Seguro que deseas cerrar esta acción?");

    if (!ok) return;

    try {
      const res = await fetch(`${API_ACTION_PLANS}/${encodeURIComponent(id)}/cerrar`, {
        method: "PATCH",
        headers: {
          "Accept": "application/json"
        }
      });

      const text = await res.text();
      let json = {};

      try {
        json = JSON.parse(text);
      } catch {
        json = { ok: false, error: text };
      }

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || json.detalle || `HTTP ${res.status}`);
      }

      await cargarActionPlansDesdeBD();
    } catch (error) {
      console.error("Error cerrando acción en BD:", error);
      alert("No se pudo cerrar la acción en la base de datos.");
    }
  };

  window.eliminarHallazgo = async function (id) {
    if (!esAdminActionPlan()) {
      alert("Solo un administrador puede eliminar planes de acción.");
      return;
    }

    const ok = confirm("¿Seguro que deseas eliminar este plan de acción?");

    if (!ok) return;

    try {
      const role = getRolUsuarioActionPlan();

      const res = await fetch(`${API_ACTION_PLANS}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "x-user-role": role
        }
      });

      const text = await res.text();
      let json = {};

      try {
        json = JSON.parse(text);
      } catch {
        json = { ok: false, error: text };
      }

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || json.detalle || `HTTP ${res.status}`);
      }

      await cargarActionPlansDesdeBD();
    } catch (error) {
      console.error("Error eliminando plan en BD:", error);
      alert("No se pudo eliminar el plan de acción en la base de datos.");
    }
  };

  // ======================================================
  // EVENTOS
  // ======================================================
  if (btnExportarActionPlan) {
    btnExportarActionPlan.addEventListener("click", exportarActionPlanExcel);
  }

  if (btnGuardarHallazgo) {
    btnGuardarHallazgo.addEventListener("click", function (e) {
      e.preventDefault();
      guardarHallazgo();
    });
  }

  if (hallazgoBusinessUnit) {
    hallazgoBusinessUnit.addEventListener("change", function () {
      const idBU = obtenerIdBusinessUnitSeleccionada();
      llenarProductionLinesSelect(idBU, "");
    });
  }

  if (hallazgoModulo) {
    hallazgoModulo.addEventListener("change", function () {
      cargarPreguntasPorModulo(this.value);
    });
  }

  if (hallazgoPregunta) {
    hallazgoPregunta.addEventListener("change", function () {
      const option = hallazgoPregunta.options[hallazgoPregunta.selectedIndex];
      const textoCompleto = option?.dataset?.texto || "";

      actualizarPreviewPregunta(textoCompleto);
    });
  }

  if (modalEl) {
    modalEl.addEventListener("show.bs.modal", function () {
      if (!hallazgoId || !hallazgoId.value) {
        limpiarFormulario();
      } else {
        llenarListaResponsables();
      }
    });
  }

  [filtroEstado, filtroBusinessUnit, filtroTexto].forEach(el => {
    if (!el) return;

    el.addEventListener("input", renderTable);
    el.addEventListener("change", renderTable);
  });

  if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener("click", function () {
      if (filtroEstado) filtroEstado.value = "";
      if (filtroBusinessUnit) filtroBusinessUnit.value = "";
      if (filtroTexto) filtroTexto.value = "";

      setStatusCardActive("");
      renderTable();
    });
  }

  // ======================================================
  // INICIO
  // ======================================================
  await cargarCatalogosDesdeBD();
  await cargarResponsablesActionPlan();

  limpiarFormulario();
  inicializarStatusCards();

  await cargarActionPlansDesdeBD();
});
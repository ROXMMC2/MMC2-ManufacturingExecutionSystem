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
 const hallazgoComentario = document.getElementById("hallazgoComentarios");
 const modalEl = document.getElementById("modalHallazgo");
 const modal = modalEl ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;
 let responsablesActionPlan = [];
 let preguntasCache = [];
 let businessUnitsCache = [];
 let productionLinesCache = [];
 let actionPlanItemsCache = [];
 const params = new URLSearchParams(window.location.search);
 const buParam = params.get("bu");
 const plParam = params.get("pl");
 const actionPlanSubtitle = document.getElementById("actionPlanSubtitle");
 const MODULES_BY_ID = {
   "1": "Manufacturing Strategy",
   "2": "Foundations",
   "3": "High Performance Teams",
   "4": "Quality at Source",
   "5": "Safety First",
   "6": "Design Improvement"
 };
 if (actionPlanSubtitle) {
   if (buParam && plParam) {
     actionPlanSubtitle.textContent = `Plan de acción para ${buParam} / ${plParam}.`;
   } else if (buParam) {
     actionPlanSubtitle.textContent = `Plan de acción para Business Unit: ${buParam}.`;
   } else {
     actionPlanSubtitle.textContent = "Seguimiento de hallazgos, responsables, fechas compromiso y estatus.";
   }
 }
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
   if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
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
     return JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(localStorage.getItem("user")) || null;
   } catch (error) {
     return null;
   }
 }
 function getUsuarioActualActionPlan() {
   const currentUser = getUsuarioSesionActionPlan();
   if (!currentUser) return "Usuario";
   return currentUser.name || currentUser.nombre || currentUser.username || currentUser.usuario || "Usuario";
 }
 function getUsuarioActualIdActionPlan() {
   const currentUser = getUsuarioSesionActionPlan();
   if (!currentUser) return "";
   return String(currentUser.id || currentUser.idusuario || currentUser.idUsuario || currentUser.IdUsuario || "");
 }
 function getRolUsuarioActionPlan() {
   const user = getUsuarioSesionActionPlan();
   if (!user) return "";
   return String(user.role || user.rol || user.tipo || user.perfil || "").trim();
 }
 function esAdminActionPlan() {
   const role = getRolUsuarioActionPlan().toUpperCase();
   return role === "ADMIN" || role === "ADMINISTRADOR" || role === "ADMINISTRATOR";
 }
 function calcularEstadoAutomatico(fechaCompromiso, fechaCierre, estadoManual) {
   const compromiso = parseDateOnly(fechaCompromiso);
   const cierre = parseDateOnly(fechaCierre);
   const hoy = parseDateOnly(getToday());
   if (cierre) return "CERRADO";
   if (compromiso && hoy && compromiso < hoy) return "VENCIDO";
   const estado = String(estadoManual || "").toUpperCase();
   if (estado === "CERRADO") return "CERRADO";
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
   preguntaPreview.textContent = texto || "Selecciona una pregunta para ver el texto completo.";
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
       headers: { Accept: "application/json" }
     });
     const data = await res.json().catch(() => ({}));
     if (!res.ok) throw new Error(data.detalle || data.error || data.message || `Error HTTP ${res.status}`);
     const usuarios = Array.isArray(data) ? data : Array.isArray(data.usuarios) ? data.usuarios : Array.isArray(data.users) ? data.users : Array.isArray(data.data) ? data.data : [];
     responsablesActionPlan = usuarios
       .filter((u) => {
         const activo = u.activo ?? u.Activo ?? u.active ?? u.isActive ?? 1;
         return String(activo) === "1" || activo === true || String(activo).toLowerCase() === "true";
       })
       .map((u) => String(u.nombre ?? u.Nombre ?? u.name ?? u.Name ?? u.usuario ?? u.Usuario ?? u.username ?? "").trim())
       .filter((nombre) => nombre !== "");
     responsablesActionPlan = [...new Set(responsablesActionPlan)].sort((a, b) => a.localeCompare(b, "es"));
     llenarListaResponsables();
   } catch (error) {
     console.error("Error cargando responsables:", error);
     responsablesActionPlan = [];
     llenarListaResponsables();
   }
 }
 function llenarListaResponsables() {
   const datalist = document.getElementById("listaResponsables");
   if (!datalist) return;
   datalist.innerHTML = responsablesActionPlan.map((nombre) => `<option value="${escapeHTML(nombre)}"></option>`).join("");
 }
 // ======================================================
 // NORMALIZAR BACKEND
 // ======================================================
 function normalizarActionPlanBackend(item) {
   const fechaCompromiso = convertirFecha(item.fechaCompromiso || item.fechacompromiso || item.fecha_compromiso || "");
   const fechaCierre = convertirFecha(item.fechaCierre || item.fechacierre || item.fecha_cierre || "");
   const estadoCalculado = calcularEstadoAutomatico(fechaCompromiso, fechaCierre, item.estado || "ABIERTO");
   return {
    id: item.id || item.idActionPlan || item.id_action_plan || item.idaccion || "",
    fecha: convertirFecha(item.fecha),
    creadoPor: item.creadoPor || item.creado_por || item.createdBy || item.usuarioCreador || "Usuario",
    creadoPorId: item.creadoPorId || item.idUsuario || item.id_usuario || "",
    idBusinessUnit: item.idBusinessUnit || item.id_business_unit || item.idbusinessunit || "",
    businessUnit: item.businessUnit || item.business_unit || item.BusinessUnit || "",
    idProductionLine: item.idProductionLine || item.id_production_line || item.idproductionline || "",
    productionLine: item.productionLine || item.production_line || item.ProductionLine || "",
    idModulo: item.idModulo || item.id_modulo || item.idmodulo || "",
    modulo: item.modulo || MODULES_BY_ID[String(item.idModulo || item.id_modulo || item.idmodulo || "")] || item.kpi || "",
    idPregunta: item.idPregunta || item.id_pregunta || item.idpregunta || "",
    pregunta: item.pregunta || item.descripcion || "",
    accionRequerida: item.accionRequerida || item.accion_requerida || item.accion || "",
    responsable: item.responsable || "",
    comentarios: item.comentarios || item.comentario || item.comments || "",
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
    comentarios: item.comentarios || "",
    fechaCompromiso: item.fechaCompromiso || null,
    fechaCierre: item.fechaCierre || null,
    estado: item.estado || "ABIERTO"
   };
}
 // ======================================================
 // CATÁLOGOS
 // ======================================================
 function normalizarBusinessUnit(bu) {
   return {
     // CORRECCIÓN: Agregar id_business_unit (snake_case)
     id: String(bu.id || bu.id_business_unit || bu.idbusinessunit || bu.IdBusinessUnit || bu.idBusinessUnit || ""),
     nombre: String(bu.nombre || bu.name || bu.NombreBusinessUnit || bu.businessUnit || "").trim()
   };
 }
 function normalizarProductionLine(pl) {
   return {
     // CORRECCIÓN: Agregar id_production_line (snake_case)
     id: String(pl.id || pl.id_production_line || pl.idproductionline || pl.IdProductionLine || pl.idProductionLine || ""),
     nombre: String(pl.nombre || pl.name || pl.NombreProductionLine || pl.productionLine || "").trim(),
     // CORRECCIÓN: Agregar id_business_unit (snake_case)
     idBusinessUnit: String(pl.id_business_unit || pl.idbusinessunit || pl.IdBusinessUnit || pl.idBusinessUnit || pl.idbu || "")
   };
 }
 async function cargarCatalogosDesdeBD() {
   try {
     const res = await fetch(`${API_BASE}/api/catalogos?t=${Date.now()}`, { method: "GET", cache: "no-store" });
     const data = await res.json().catch(() => ({}));
     if (!res.ok || data.ok === false) throw new Error(data.detalle || "No se pudieron cargar los catálogos.");
     businessUnitsCache = Array.isArray(data.businessUnits) ? data.businessUnits.map(normalizarBusinessUnit).filter(bu => bu.id && bu.nombre) : [];
     productionLinesCache = Array.isArray(data.productionLines) ? data.productionLines.map(normalizarProductionLine).filter(pl => pl.id && pl.nombre) : [];
   } catch (error) {
     console.error("Error cargando catálogos:", error);
     businessUnitsCache = [];
     productionLinesCache = [];
   }
 }
 function llenarBusinessUnitsSelect(valorSeleccionado = "") {
   if (!hallazgoBusinessUnit) return;
   const businessUnitsOrdenadas = [...businessUnitsCache].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
   hallazgoBusinessUnit.innerHTML = `
<option value="">Todas / Selecciona Business Unit</option>
     ${businessUnitsOrdenadas.map(bu => {
       const selected = String(valorSeleccionado).trim().toLowerCase() === String(bu.nombre).trim().toLowerCase() || String(valorSeleccionado) === String(bu.id) ? "selected" : "";
       return `<option value="${escapeHTML(bu.nombre)}" data-id="${escapeHTML(bu.id)}" ${selected}>${escapeHTML(bu.nombre)}</option>`;
     }).join("")}
   `;
 }
 function obtenerIdBusinessUnitSeleccionada() {
   if (!hallazgoBusinessUnit) return "";
   const option = hallazgoBusinessUnit.options[hallazgoBusinessUnit.selectedIndex];
   if (!option || !option.value) return "";
   return option?.dataset?.id || "";
 }
 function obtenerIdProductionLineSeleccionada() {
   if (!hallazgoProductionLine) return "";
   const option = hallazgoProductionLine.options[hallazgoProductionLine.selectedIndex];
   if (!option || !option.value) return "";
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
     hallazgoProductionLine.innerHTML = `<option value="">No hay Production Lines disponibles</option>`;
     hallazgoProductionLine.disabled = false;
     return;
   }
   hallazgoProductionLine.innerHTML = `
<option value="">Todas / Selecciona Production Line</option>
     ${lines.map(pl => {
       const selected = String(valorSeleccionado).trim().toLowerCase() === String(pl.nombre).trim().toLowerCase() || String(valorSeleccionado) === String(pl.id) ? "selected" : "";
       return `<option value="${escapeHTML(pl.nombre)}" data-id="${escapeHTML(pl.id)}" data-idbusinessunit="${escapeHTML(pl.idBusinessUnit)}" ${selected}>${escapeHTML(pl.nombre)}</option>`;
     }).join("")}
   `;
   hallazgoProductionLine.disabled = false;
 }
 // ======================================================
 // PREGUNTAS
 // ======================================================
 function obtenerNombreModuloSeleccionado() {
   if (!hallazgoModulo) return "";
   const option = hallazgoModulo.options[hallazgoModulo.selectedIndex];
   if (!option || !option.value) return ""; // Evita guardar el texto "Selecciona un módulo"
   return option?.dataset?.nombre || option?.textContent?.trim() || "";
 }
 function obtenerTextoPreguntaSeleccionada() {
   if (!hallazgoPregunta) return "";
   const option = hallazgoPregunta.options[hallazgoPregunta.selectedIndex];
   if (!option || !option.value) return ""; // Evita guardar el texto "Selecciona una pregunta"
   return option?.dataset?.texto || option?.textContent?.trim() || "";
 }
 function normalizarPreguntaBD(q) {
   return {
     // CORRECCIÓN: Agregar id_pregunta y id_modulo (snake_case)
     idpregunta: String(q.idpregunta ?? q.id_pregunta ?? q.idPregunta ?? q.IdPregunta ?? q.id ?? ""),
     texto: String(q.texto ?? q.text ?? q.pregunta ?? q.descripcion ?? "").trim(),
     idmodulo: String(q.idmodulo ?? q.id_modulo ?? q.idModulo ?? q.IdModulo ?? q.moduleId ?? ""),
     orden: Number(q.orden ?? q.order ?? q.numeroPregunta ?? q.numero_pregunta ?? q.numero ?? 0)
   };
 }
 async function cargarPreguntasDesdeBD() {
   if (preguntasCache.length > 0) return preguntasCache;
   try {
     const res = await fetch(`${API_BASE}/api/preguntas?t=${Date.now()}`, { method: "GET", cache: "no-store" });
     if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
     const data = await res.json();
     if (!Array.isArray(data)) throw new Error("La respuesta no es un arreglo.");
     preguntasCache = data.map(normalizarPreguntaBD);
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
     hallazgoPregunta.innerHTML = `<option value="">Primero selecciona un módulo</option>`;
     return;
   }
   hallazgoPregunta.innerHTML = `<option value="">Cargando preguntas...</option>`;
   const preguntas = await cargarPreguntasDesdeBD();
   const preguntasDelModulo = preguntas.filter(p => String(p.idmodulo) === String(idModulo)).filter(p => p.texto).sort((a, b) => Number(a.orden) - Number(b.orden));
   if (!preguntasDelModulo.length) {
     hallazgoPregunta.innerHTML = `<option value="">No hay preguntas relacionadas a este módulo</option>`;
     actualizarPreviewPregunta("No hay preguntas relacionadas a este módulo.");
     return;
   }
   hallazgoPregunta.innerHTML = `
<option value="">Selecciona una pregunta</option>
     ${preguntasDelModulo.map(p => {
       const selected = String(p.idpregunta) === String(idPreguntaSeleccionada) ? "selected" : "";
       const textoCorto = p.texto.length > 85 ? p.texto.substring(0, 85) + "..." : p.texto;
       return `<option value="${escapeHTML(p.idpregunta)}" data-texto="${escapeHTML(p.texto)}" title="${escapeHTML(p.texto)}" ${selected}>${escapeHTML(`${p.orden}. ${textoCorto}`)}</option>`;
     }).join("")}
   `;
   if (idPreguntaSeleccionada) {
     const option = hallazgoPregunta.options[hallazgoPregunta.selectedIndex];
     actualizarPreviewPregunta(option?.dataset?.texto || "");
   }
 }
 // ======================================================
 // ACTION PLANS
 // ======================================================
 function getItems() {
   return actionPlanItemsCache.map(normalizarActionPlanBackend);
 }
 async function cargarActionPlansDesdeBD() {
   try {
     if (tablaBody) tablaBody.innerHTML = `<tr><td colspan="13" class="text-center text-muted py-4">Cargando planes de acción...</td></tr>`;
     const res = await fetch(`${API_ACTION_PLANS}?t=${Date.now()}`, { method: "GET", cache: "no-store", headers: { Accept: "application/json" } });
     if (!res.ok) throw new Error(`HTTP ${res.status}`);
     const data = await res.json();
     actionPlanItemsCache = Array.isArray(data) ? data : [];
     cargarFiltroBusinessUnit();
     renderTable();
   } catch (error) {
     console.error("Error cargando planes desde BD:", error);
     if (tablaBody) tablaBody.innerHTML = `<tr><td colspan="13" class="text-center text-danger py-4">Error cargando planes de acción.</td></tr>`;
   }
 }
 function cargarFiltroBusinessUnit() {
   if (!filtroBusinessUnit) return;
   const items = getItems();
   const businessUnits = [...new Set(items.map(item => String(item.businessUnit || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
   const valorActual = filtroBusinessUnit.value || "";
   filtroBusinessUnit.innerHTML = `<option value="">Todos</option>${businessUnits.map(bu => `<option value="${escapeHTML(bu)}" ${bu === valorActual ? "selected" : ""}>${escapeHTML(bu)}</option>`).join("")}`;
 }
 function filtrarItems(items) {
   const estado = filtroEstado ? filtroEstado.value : "";
   const businessUnit = filtroBusinessUnit ? filtroBusinessUnit.value : "";
   const texto = filtroTexto ? normalizarTexto(filtroTexto.value) : "";
   return items.filter(item => {
     const estadoCalculado = calcularEstadoAutomatico(item.fechaCompromiso, item.fechaCierre, item.estado);
     const matchEstado = !estado || String(estadoCalculado || "").toUpperCase() === estado;
     const matchBUFiltro = !businessUnit || String(item.businessUnit || "") === businessUnit;
     const textoCompleto = normalizarTexto([item.fecha, item.creadoPor, item.businessUnit, item.productionLine, item.modulo, item.pregunta, item.accionRequerida, item.responsable, item.fechaCompromiso, item.fechaCierre, estadoCalculado].join(" "));
     const matchTexto = !texto || textoCompleto.includes(texto);
     const matchBUParam = !buParam || String(item.businessUnit || "") === buParam;
     const matchPLParam = !plParam || String(item.productionLine || "") === plParam;
     return matchEstado && matchBUFiltro && matchTexto && matchBUParam && matchPLParam;
   });
 }
 function setStatusCardActive(status) {
   const statusActual = String(status || "").toUpperCase();
   statusCards.forEach(card => {
     if (String(card.dataset.status || "").toUpperCase() === statusActual) {
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
     const estadoCalculado = calcularEstadoAutomatico(item.fechaCompromiso, item.fechaCierre, item.estado);
     const matchBUFiltro = !businessUnit || String(item.businessUnit || "") === businessUnit;
     const textoCompleto = normalizarTexto([item.fecha, item.creadoPor, item.businessUnit, item.productionLine, item.modulo, item.pregunta, item.accionRequerida, item.responsable, item.fechaCompromiso, item.fechaCierre, estadoCalculado].join(" "));
     const matchTexto = !texto || textoCompleto.includes(texto);
     const matchBUParam = !buParam || String(item.businessUnit || "") === buParam;
     const matchPLParam = !plParam || String(item.productionLine || "") === plParam;
     return matchBUFiltro && matchTexto && matchBUParam && matchPLParam;
   });
 }
 function actualizarContadoresStatus() {
   const itemsBase = getItemsBaseParaContadores();
   let abiertos = 0, vencidos = 0, cerrados = 0;
   itemsBase.forEach(item => {
     const estadoCalculado = calcularEstadoAutomatico(item.fechaCompromiso, item.fechaCierre, item.estado);
     if (estadoCalculado === "ABIERTO") abiertos++;
     if (estadoCalculado === "VENCIDO") vencidos++;
     if (estadoCalculado === "CERRADO") cerrados++;
   });
   if (countTodos) countTodos.textContent = itemsBase.length;
   if (countAbiertos) countAbiertos.textContent = abiertos;
   if (countVencidos) countVencidos.textContent = vencidos;
   if (countCerrados) countCerrados.textContent = cerrados;
 }
 function inicializarStatusCards() {
   statusCards.forEach(card => {
     card.addEventListener("click", function () {
       const status = String(card.dataset.status || "").toUpperCase();
       if (filtroEstado) filtroEstado.value = status;
       setStatusCardActive(status);
       renderTable();
     });
   });
 }
 function exportarActionPlanExcel() {
   if (typeof XLSX === "undefined") {
     alert("No se encontró la librería de Excel. Agrega SheetJS en el HTML.");
     return;
   }
   const items = filtrarItems(getItems());
   if (!items.length) return alert("No hay datos para exportar.");
   const dataExcel = items.map(item => ({
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
     "Estado": calcularEstadoAutomatico(item.fechaCompromiso, item.fechaCierre, item.estado)
   }));
   const worksheet = XLSX.utils.json_to_sheet(dataExcel);
   worksheet["!cols"] = [{wch:14},{wch:24},{wch:18},{wch:30},{wch:24},{wch:60},{wch:50},{wch:28},{wch:18},{wch:18},{wch:14}];
   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, "Plan de Acción");
   XLSX.writeFile(workbook, `Plan_de_Accion_${getToday()}.xlsx`);
 }
 function renderTable() {
   if (!tablaBody) return;
   setStatusCardActive(filtroEstado ? filtroEstado.value : "");
   actualizarContadoresStatus();
   const items = filtrarItems(getItems());
   if (!items.length) {
     tablaBody.innerHTML = `<tr><td colspan="13" class="text-center text-muted py-4">No hay planes de acción registrados.</td></tr>`;
     return;
   }
   tablaBody.innerHTML = items.map(item => {
     const estadoCalculado = calcularEstadoAutomatico(item.fechaCompromiso, item.fechaCierre, item.estado);
     const accionCerrada = Boolean(item.fechaCierre);
     return `
<tr>
<td>${escapeHTML(formatDate(item.fecha))}</td>
<td class="creado-por-cell">${escapeHTML(item.creadoPor || "Usuario")}</td>
<td>${escapeHTML(item.businessUnit)}</td>
<td>${escapeHTML(item.productionLine)}</td>
<td>${escapeHTML(item.modulo)}</td>
<td class="text-wrap-cell">${escapeHTML(item.pregunta)}</td>
<td class="text-wrap-cell">${escapeHTML(item.accionRequerida)}</td>
<td class="text-wrap-cell">${escapeHTML(item.comentarios || "")}</td>
<td class="text-wrap-cell">${escapeHTML(item.responsable)}</td>
<td>${escapeHTML(formatDate(item.fechaCompromiso))}</td>
<td>${escapeHTML(formatDate(item.fechaCierre))}</td>
<td><span class="estado-badge ${getEstadoClass(estadoCalculado)}">${escapeHTML(estadoCalculado)}</span></td>
<td>
<div class="action-row-buttons">
             ${!accionCerrada ? `<button type="button" class="btn btn-sm btn-outline-success" onclick="cerrarAccion('${item.id}')" title="Cerrar Acción"><i class="fa-solid fa-check"></i></button>` : ""}
<button type="button" class="btn btn-sm btn-outline-primary" onclick="editarHallazgo('${item.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
             ${esAdminActionPlan() ? `<button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarHallazgo('${item.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>` : ""}
</div>
</td>
</tr>
     `;
   }).join("");
 }
 function limpiarFormulario() {
   if (hallazgoId) hallazgoId.value = "";
   if (hallazgoFecha) hallazgoFecha.value = getToday();
   llenarBusinessUnitsSelect(buParam || "");
   const idBUSeleccionada = obtenerIdBusinessUnitSeleccionada();
   llenarProductionLinesSelect(idBUSeleccionada, plParam || "");
   if (hallazgoModulo) hallazgoModulo.value = "";
   if (hallazgoPregunta) hallazgoPregunta.innerHTML = `<option value="">Primero selecciona un módulo</option>`;
   actualizarPreviewPregunta("");
   if (hallazgoAccion) hallazgoAccion.value = "";
   if (hallazgoResponsable) hallazgoResponsable.value = "";
   if (hallazgoFechaCompromiso) hallazgoFechaCompromiso.value = "";
   if (hallazgoFechaCierre) hallazgoFechaCierre.value = "";
   if (hallazgoEstado) hallazgoEstado.value = "ABIERTO";
   if (hallazgoComentario) hallazgoComentario.value = "";
   llenarListaResponsables();
 }
 async function guardarHallazgo() {
   const id = hallazgoId ? hallazgoId.value : "";
   const fechaCompromisoValue = hallazgoFechaCompromiso ? hallazgoFechaCompromiso.value : "";
   const idModuloSeleccionado = hallazgoModulo ? hallazgoModulo.value : "";
   const nombreModuloSeleccionado = obtenerNombreModuloSeleccionado();
   const idPreguntaSeleccionada = hallazgoPregunta ? hallazgoPregunta.value : "";
   const textoPreguntaSeleccionada = obtenerTextoPreguntaSeleccionada();
   const itemAnterior = getItems().find(item => String(item.id) === String(id));
   const esNuevo = !id;
   // CORRECCIÓN: Respetar si el usuario seleccionó manualmente una fecha de cierre en el formulario
   const fechaCierreFormulario = hallazgoFechaCierre ? hallazgoFechaCierre.value : "";
   const fechaCierreReal = fechaCierreFormulario !== "" ? fechaCierreFormulario : (esNuevo ? "" : (itemAnterior?.fechaCierre || ""));
   const estadoCalculado = calcularEstadoAutomatico(
     fechaCompromisoValue,
     fechaCierreReal,
     esNuevo ? "ABIERTO" : (itemAnterior?.estado || "ABIERTO")
   );
   const nuevo = {
     id: id || "",
     fecha: hallazgoFecha ? hallazgoFecha.value : "",
     creadoPor: esNuevo ? getUsuarioActualActionPlan() : (itemAnterior?.creadoPor || getUsuarioActualActionPlan()),
     creadoPorId: esNuevo ? getUsuarioActualIdActionPlan() : (itemAnterior?.creadoPorId || getUsuarioActualIdActionPlan()),
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
     comentarios: hallazgoComentario ? hallazgoComentario.value.trim() : "",
     fechaCompromiso: fechaCompromisoValue,
     fechaCierre: fechaCierreReal,
     estado: estadoCalculado
   };
   if (!nuevo.fecha || !nuevo.businessUnit || !nuevo.productionLine || !nuevo.idModulo || !nuevo.idPregunta) {
     alert("Completa al menos Fecha, Business Unit, Production Line, Módulo y Pregunta.");
     return;
   }
   if (!nuevo.accionRequerida) return alert("Escribe la acción requerida.");
   if (!nuevo.responsable) return alert("Selecciona o escribe un responsable.");
   if (!nuevo.fechaCompromiso) return alert("Selecciona una fecha compromiso.");
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
       headers: { "Content-Type": "application/json", Accept: "application/json" },
       body: JSON.stringify(payload)
     });
     const text = await res.text();
     let json = {};
     try { json = JSON.parse(text); } catch { json = { ok: false, error: text }; }
     if (!res.ok || json.ok === false) {
       throw new Error(json.detalle || json.error || json.message || text || `HTTP ${res.status}`);
     }
     if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
     limpiarFormulario();
     await cargarActionPlansDesdeBD();
   } catch (error) {
     console.error("Error guardando plan en BD:", error);
     alert("No se pudo guardar el plan de acción.\n\nDetalle: " + (error.message || "Error desconocido"));
   }
 }
 window.editarHallazgo = async function (id) {
   const item = getItems().find(x => String(x.id) === String(id));
   if (!item) return;
   if (hallazgoId) hallazgoId.value = item.id || "";
   if (hallazgoFecha) hallazgoFecha.value = item.fecha || "";
   llenarBusinessUnitsSelect(item.idBusinessUnit || item.businessUnit || "");
   const idBUSeleccionada = obtenerIdBusinessUnitSeleccionada();
   llenarProductionLinesSelect(idBUSeleccionada, item.idProductionLine || item.productionLine || "");
   if (hallazgoModulo) hallazgoModulo.value = item.idModulo || "";
   await cargarPreguntasPorModulo(item.idModulo || "", item.idPregunta || "");
   if (hallazgoAccion) hallazgoAccion.value = item.accionRequerida || "";
   if (hallazgoResponsable) hallazgoResponsable.value = item.responsable || "";
   if (hallazgoFechaCompromiso) hallazgoFechaCompromiso.value = item.fechaCompromiso || "";
   if (hallazgoFechaCierre) hallazgoFechaCierre.value = item.fechaCierre || "";
   if (hallazgoEstado) hallazgoEstado.value = item.estado || "ABIERTO";
   if (hallazgoComentario) hallazgoComentario.value = item.comentarios || "";
   llenarListaResponsables();
   if (modal) modal.show();
 };
 window.cerrarAccion = async function (id) {
   if (!confirm("¿Seguro que deseas cerrar esta acción?")) return;
   try {
     const res = await fetch(`${API_ACTION_PLANS}/${encodeURIComponent(id)}/cerrar`, { method: "PATCH", headers: { Accept: "application/json" } });
     const text = await res.text();
     let json = {};
     try { json = JSON.parse(text); } catch { json = { ok: false, error: text }; }
     if (!res.ok || json.ok === false) throw new Error(json.error || json.detalle || `HTTP ${res.status}`);
     await cargarActionPlansDesdeBD();
   } catch (error) {
     console.error("Error cerrando acción:", error);
     alert("No se pudo cerrar la acción en la base de datos.");
   }
 };
 window.eliminarHallazgo = async function (id) {
   if (!esAdminActionPlan()) return alert("Solo un administrador puede eliminar planes de acción.");
   if (!confirm("¿Seguro que deseas eliminar este plan de acción?")) return;
   try {
     const res = await fetch(`${API_ACTION_PLANS}/${encodeURIComponent(id)}`, {
       method: "DELETE",
       headers: { Accept: "application/json", "x-user-role": getRolUsuarioActionPlan() }
     });
     const text = await res.text();
     let json = {};
     try { json = JSON.parse(text); } catch { json = { ok: false, error: text }; }
     if (!res.ok || json.ok === false) throw new Error(json.error || json.detalle || `HTTP ${res.status}`);
     await cargarActionPlansDesdeBD();
   } catch (error) {
     console.error("Error eliminando plan:", error);
     alert("No se pudo eliminar el plan de acción en la base de datos.");
   }
 };
 // ======================================================
 // EVENTOS
 // ======================================================
 if (btnExportarActionPlan) btnExportarActionPlan.addEventListener("click", exportarActionPlanExcel);
 if (btnGuardarHallazgo) {
   btnGuardarHallazgo.addEventListener("click", function (e) {
     e.preventDefault();
     guardarHallazgo();
   });
 }
 if (hallazgoBusinessUnit) {
   hallazgoBusinessUnit.addEventListener("change", function () {
     llenarProductionLinesSelect(obtenerIdBusinessUnitSeleccionada(), "");
   });
 }
 if (hallazgoModulo) hallazgoModulo.addEventListener("change", function () { cargarPreguntasPorModulo(this.value); });
 if (hallazgoPregunta) {
   hallazgoPregunta.addEventListener("change", function () {
     const option = hallazgoPregunta.options[hallazgoPregunta.selectedIndex];
     actualizarPreviewPregunta(option?.dataset?.texto || "");
   });
 }
 if (modalEl) {
   modalEl.addEventListener("show.bs.modal", function () {
     if (!hallazgoId || !hallazgoId.value) limpiarFormulario();
     else llenarListaResponsables();
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
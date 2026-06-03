document.addEventListener("DOMContentLoaded", function () {
 // ======================================================
 // CONFIGURACIÓN DE MÓDULOS
 // ======================================================
 const MODULES = [
   {
     id: "1.0 Manufacturing Strategy",
     shortName: "Manufacturing Strategy",
     questions: [1, 2, 3, 4, 5, 6, 7, 8]
   },
   {
     id: "2.0 Foundations",
     shortName: "Foundations",
     questions: [9, 10, 11, 12, 13, 14, 15, 16]
   },
   {
     id: "3.0 High Performance Teams",
     shortName: "High Performance Teams",
     questions: [17]
   },
   {
     id: "4.0 Quality at Source",
     shortName: "Quality at Source",
     questions: [18, 19, 20, 21]
   },
   {
     id: "5.0 Safety First",
     shortName: "Safety First",
     questions: [22, 23, 24, 25]
   },
   {
     id: "6.0 Design Improvement",
     shortName: "Design Improvement",
     questions: [26, 27]
   }
 ];

 // ======================================================
 // PONDERACIÓN REAL DEL EXCEL
 // 0-100 FINAL SCORE
 // ======================================================
 const MODULE_WEIGHTS = {
   "Manufacturing Strategy": 0.30,
   "Foundations": 0.40,
   "High Performance Teams": 0.10,
   "Quality at Source": 0.05,
   "Safety First": 0.10,
   "Design Improvement": 0.05
 };

 // ======================================================
 // DETECTAR PÁGINA
 // ======================================================
 const rutaActual = window.location.pathname.toLowerCase();
 const esPowerBI = rutaActual.includes("powerbi");
 const esReportes = rutaActual.includes("reportes");

 // ======================================================
 // ELEMENTOS
 // ======================================================
 const fechaHoyEl = document.getElementById("fechaHoy");
 const infoEl = document.getElementById("info");
 const estadoCargaEl = document.getElementById("estadoCarga");

 const contenedorBusinessUnit = document.getElementById("contenedorBusinessUnit");

 const seccionReportes = document.getElementById("seccionReportes");
 const seccionActionPlan = document.getElementById("seccionActionPlan");
 const contenedorActionPlan = document.getElementById("contenedorActionPlan");

 const btnSeccionReportes = document.getElementById("btnSeccionReportes");
 const btnSeccionActionPlan = document.getElementById("btnSeccionActionPlan");

 const toggleSidebarBtn = document.getElementById("toggleSidebar");
 const sidebar = document.getElementById("sidebar");
 const sidebarOverlay = document.getElementById("sidebarOverlay");

 const tablaWrapper = document.querySelector(".table-wrapper");

 if (tablaWrapper) {
   tablaWrapper.style.display = "none";
 }

 let dashboardEl = document.getElementById("dashboardContainer");

 if (esPowerBI && !dashboardEl && infoEl) {
   dashboardEl = document.createElement("div");
dashboardEl.id = "dashboardContainer";
   dashboardEl.className = "mb-4";
   infoEl.insertAdjacentElement("afterend", dashboardEl);
 }

 if (esPowerBI && contenedorBusinessUnit) {
   contenedorBusinessUnit.style.display = "none";
 }

 // ======================================================
 // SIDEBAR
 // ======================================================
 if (toggleSidebarBtn && sidebar && sidebarOverlay) {
   toggleSidebarBtn.addEventListener("click", function () {
     sidebar.classList.toggle("open");
     sidebarOverlay.classList.toggle("show");
   });

   sidebarOverlay.addEventListener("click", function () {
     sidebar.classList.remove("open");
     sidebarOverlay.classList.remove("show");
   });
 }

 // ======================================================
 // SECCIONES REPORTES / PLAN DE ACCIÓN
 // ======================================================
 function mostrarSeccionReportes() {
   if (!seccionReportes || !seccionActionPlan) return;

   seccionReportes.style.display = "";
   seccionActionPlan.style.display = "none";

   if (btnSeccionReportes && btnSeccionActionPlan) {
     btnSeccionReportes.classList.remove("btn-outline-primary");
     btnSeccionReportes.classList.add("btn-primary");

     btnSeccionActionPlan.classList.remove("btn-primary");
     btnSeccionActionPlan.classList.add("btn-outline-primary");
   }
 }

 function mostrarSeccionActionPlan() {
   if (!seccionReportes || !seccionActionPlan) return;

   seccionReportes.style.display = "none";
   seccionActionPlan.style.display = "";

   if (btnSeccionReportes && btnSeccionActionPlan) {
     btnSeccionActionPlan.classList.remove("btn-outline-primary");
     btnSeccionActionPlan.classList.add("btn-primary");

     btnSeccionReportes.classList.remove("btn-primary");
     btnSeccionReportes.classList.add("btn-outline-primary");
   }
 }

 function aplicarSeccionDesdeHash() {
   const hash = String(window.location.hash || "").toLowerCase();

   if (hash === "#plan-accion") {
     mostrarSeccionActionPlan();
   } else {
     mostrarSeccionReportes();
   }
 }

 if (btnSeccionReportes) {
   btnSeccionReportes.addEventListener("click", function () {
     window.location.hash = "reportes";
     mostrarSeccionReportes();
   });
 }

 if (btnSeccionActionPlan) {
   btnSeccionActionPlan.addEventListener("click", function () {
     window.location.hash = "plan-accion";
     mostrarSeccionActionPlan();
   });
 }

 window.addEventListener("hashchange", aplicarSeccionDesdeHash);

 // ======================================================
 // FECHA ACTUAL
 // ======================================================
 if (fechaHoyEl) {
   fechaHoyEl.textContent = new Date().toLocaleDateString("es-MX", {
     year: "numeric",
     month: "long",
     day: "numeric"
   });
 }

 // ======================================================
 // VALIDACIONES
 // ======================================================
 if (!infoEl) {
   console.error("❌ No se encontró #info.");
 }

 if (esPowerBI && !dashboardEl) {
   console.error("❌ No se encontró #dashboardContainer en PowerBi.");
 }

 if (esReportes && !contenedorBusinessUnit) {
   console.error("❌ No se encontró #contenedorBusinessUnit en Reportes.");
 }

 // ======================================================
 // FUNCIONES AUXILIARES
 // ======================================================
function escapeHTML(valor) {
  if (valor === null || valor === undefined) return "";

  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

 function parsearFechaHora(fecha) {
   if (!fecha) return null;

   const texto = String(fecha).trim();

   // Formato local: YYYY-MM-DD HH:mm:ss o YYYY-MM-DDTHH:mm:ss
   let match = texto.match(
     /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/
   );

   if (match) {
     const year = Number(match[1]);
     const month = Number(match[2]) - 1;
     const day = Number(match[3]);
     const hour = Number(match[4] || 0);
     const minute = Number(match[5] || 0);
     const second = Number(match[6] || 0);

     return new Date(year, month, day, hour, minute, second);
   }

   // Formato DD/MM/YYYY o DD-MM-YYYY
   match = texto.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);

   if (match) {
     const day = Number(match[1]);
     const month = Number(match[2]) - 1;
     const year = Number(match[3]);

     return new Date(year, month, day);
   }

   // Último respaldo
   const d = new Date(texto);

   if (!isNaN(d.getTime())) {
     return d;
   }

   return null;
 }

 function extraerPartesFecha(fecha) {
   const d = parsearFechaHora(fecha);

   if (!d || isNaN(d.getTime())) return null;

   return {
     year: d.getFullYear(),
     month: d.getMonth() + 1,
     day: d.getDate()
   };
 }

 function formatearFecha(fecha) {
   const d = parsearFechaHora(fecha);

   if (!d || isNaN(d.getTime())) return "Sin fecha";

   return d.toLocaleDateString("es-MX", {
     year: "numeric",
     month: "long",
     day: "numeric"
   });
 }

 function formatearHora(fecha) {
   const d = parsearFechaHora(fecha);

   if (!d || isNaN(d.getTime())) return "Sin hora";

   return d.toLocaleTimeString("es-MX", {
     hour: "2-digit",
     minute: "2-digit",
     hour12: false
   });
 }

 function formatearFechaHoraCompleta(fecha) {
   return `${formatearFecha(fecha)} - ${formatearHora(fecha)}`;
 }

 function obtenerFechaKey(fecha) {
   const partes = extraerPartesFecha(fecha);

   if (!partes) return "sin-fecha";

   const yyyy = String(partes.year);
   const mm = String(partes.month).padStart(2, "0");
   const dd = String(partes.day).padStart(2, "0");

   return `${yyyy}-${mm}-${dd}`;
 }

 function setEstadoCarga(mensaje) {
   if (estadoCargaEl) {
     estadoCargaEl.innerHTML = mensaje;
   }
 }

 function limpiarEstadoCarga() {
   if (estadoCargaEl) {
     estadoCargaEl.innerHTML = "";
   }
 }

 function crearIdSeguro(texto) {
   return String(texto || "")
     .toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^a-z0-9]+/g, "-")
     .replace(/^-+|-+$/g, "");
 }

 function ordenarTextoAsc(arr) {
   return [...arr].sort((a, b) => String(a).localeCompare(String(b), "es"));
 }

 function redondear(num, decimales = 2) {
   return Number(num || 0).toFixed(decimales);
 }

 // ======================================================
 // PREGUNTAS / MÓDULOS
 // ======================================================
 function obtenerNumeroPregunta(registro) {
   const candidatos = [
     registro.idpregunta,
     registro.idPregunta,
     registro.IdPregunta,
     registro.questionId,
     registro.question_id,
     registro.numeroPregunta,
     registro.numero_pregunta,
     registro.pregunta
   ];

   for (const valor of candidatos) {
     if (valor === null || valor === undefined || valor === "") continue;

     if (typeof valor === "number" && !isNaN(valor)) {
       return Number(valor);
     }

     const texto = String(valor).trim();

     if (/^\d+$/.test(texto)) {
       return Number(texto);
     }
   }

   return null;
 }

 function obtenerModuloPorNumeroPregunta(numeroPregunta) {
   const numero = Number(numeroPregunta);

   if (isNaN(numero)) return "Sin módulo";

   const modulo = MODULES.find(m => m.questions.includes(numero));

   return modulo ? modulo.shortName : "Sin módulo";
 }

 function obtenerTextoPregunta(registro, numeroPregunta) {
   const candidatosTexto = [
     registro.textoPregunta,
     registro.texto_pregunta,
     registro.questionText,
     registro.question_text,
     registro.descripcion_pregunta,
     registro.descripcionPregunta,
     registro.descripcion
   ];

   for (const valor of candidatosTexto) {
     if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
       return String(valor).trim();
     }
   }

   if (registro.pregunta !== null && registro.pregunta !== undefined) {
     const textoPregunta = String(registro.pregunta).trim();

     if (textoPregunta !== "" && !/^\d+$/.test(textoPregunta)) {
       return textoPregunta;
     }
   }

   if (numeroPregunta !== null && numeroPregunta !== undefined) {
     return `Pregunta ${numeroPregunta}`;
   }

   return "Sin pregunta";
 }

 function normalizarRegistro(r) {
   const numeroPregunta = obtenerNumeroPregunta(r);
   const textoPregunta = obtenerTextoPregunta(r, numeroPregunta);

   return {
     idreview: r.idreview ?? r.idReview ?? r.review_id ?? r.IdReview ?? "",
     fechareview: r.fechareview ?? r.fechaReview ?? r.fecha ?? r.FechaReview ?? "",
     usuario: r.usuario ?? r.reviewer ?? r.auditor ?? r.NombreUsuario ?? "",
     businessunit: r.businessunit ?? r.businessUnit ?? r.bu ?? r.NombreBusinessUnit ?? "",
     productionline: r.productionline ?? r.productionLine ?? r.linea ?? r.NombreProductionLine ?? "",
     numeroPregunta: numeroPregunta,
     pregunta: textoPregunta,
     modulo: r.modulo ?? r.NombreModulo ?? obtenerModuloPorNumeroPregunta(numeroPregunta),
     puntuacion: r.puntuacion ?? r.score ?? r.calificacion ?? r.Puntuacion ?? "",
     comentario: r.comentario ?? r.comments ?? r.Comentario ?? ""
   };
 }

 // ======================================================
 // PUNTUACIÓN
 // ======================================================
 function obtenerPuntuacionNumerica(registro) {
   const valor = Number(registro.puntuacion);

   if (!isNaN(valor) && valor >= 0) {
     return Math.max(0, Math.min(3, valor));
   }

   return 0;
 }

 function obtenerClasePuntuacion(score) {
   if (score >= 2.5) return "bg-success";
   if (score >= 1.5) return "bg-primary";
   if (score >= 0.5) return "bg-warning text-dark";
   return "bg-danger";
 }

 function obtenerClasePuntuacion100(score) {
   const valor = Number(score) || 0;

   if (valor >= 85) return "bg-success";
   if (valor >= 70) return "bg-primary";
   if (valor >= 50) return "bg-warning text-dark";
   return "bg-danger";
 }

 // ======================================================
 // RESUMEN SUPERIOR
 // ======================================================
 function renderInfo(data) {
   if (!infoEl) return;

   if (!data || data.length === 0) {
     infoEl.innerHTML = "<p>No hay datos.</p>";
     return;
   }

   const normalizados = data.map(normalizarRegistro);

   const totalReviews = new Set(
     normalizados
       .map(r => r.idreview)
       .filter(v => v !== null && v !== undefined && v !== "")
   ).size;

   const totalBusinessUnits = new Set(
     normalizados
       .map(r => (r.businessunit || "").trim())
       .filter(v => v !== "")
   ).size;

   const totalProductionLines = new Set(
     normalizados
       .map(r => (r.productionline || "").trim())
       .filter(v => v !== "")
   ).size;

   if (esReportes) {
     infoEl.innerHTML = `
<div class="row g-3 mb-3">
<div class="col-md-4">
<div class="p-3 border rounded bg-white">
<strong>Total de reviews:</strong><br>
<span>${totalReviews}</span>
</div>
</div>

<div class="col-md-4">
<div class="p-3 border rounded bg-white">
<strong>Business Units:</strong><br>
<span>${totalBusinessUnits}</span>
</div>
</div>

<div class="col-md-4">
<div class="p-3 border rounded bg-white">
<strong>Production Lines:</strong><br>
<span>${totalProductionLines}</span>
</div>
</div>
</div>
     `;
     return;
   }

   infoEl.innerHTML = "";
 }

 // ======================================================
 // AGRUPAR POR BUSINESS UNIT -> PRODUCTION LINE -> REVIEW
 // ======================================================
 function agruparPorBUyPLyReview(data) {
   const grupos = {};

   data.forEach((r) => {
     const row = normalizarRegistro(r);
     const score = obtenerPuntuacionNumerica(row);

     const businessUnit =
       row.businessunit && row.businessunit.trim() !== ""
         ? row.businessunit.trim()
         : "Sin Business Unit";

     const productionLine =
       row.productionline && row.productionline.trim() !== ""
         ? row.productionline.trim()
         : "Sin Production Line";

     const reviewId =
       row.idreview && String(row.idreview).trim() !== ""
         ? String(row.idreview).trim()
         : `${obtenerFechaKey(row.fechareview)}-${row.usuario || "sin-usuario"}-${row.fechareview || ""}`;

     if (!grupos[businessUnit]) {
       grupos[businessUnit] = {};
     }

     if (!grupos[businessUnit][productionLine]) {
       grupos[businessUnit][productionLine] = {};
     }

     if (!grupos[businessUnit][productionLine][reviewId]) {
       grupos[businessUnit][productionLine][reviewId] = [];
     }

     grupos[businessUnit][productionLine][reviewId].push({
       ...row,
       puntuacionNumerica: score
     });
   });

   return grupos;
 }

 // ======================================================
 // SCORE FINAL PONDERADO 0 A 100
 // ======================================================
 function calcularFinalReview(registrosReview) {
   if (!registrosReview || !registrosReview.length) return 0;

   const scoresPorModulo = {};

   registrosReview.forEach(r => {
     const modulo = String(r.modulo || "Sin módulo").trim();
     const score = Number(r.puntuacionNumerica);

     if (isNaN(score)) return;

     if (!scoresPorModulo[modulo]) {
       scoresPorModulo[modulo] = [];
     }

     scoresPorModulo[modulo].push(score);
   });

   let totalPonderado = 0;

   Object.entries(MODULE_WEIGHTS).forEach(([moduleName, weight]) => {
     const scores = scoresPorModulo[moduleName] || [];

     if (!scores.length) {
       totalPonderado += 0;
       return;
     }

     const promedioModulo03 =
       scores.reduce((acc, n) => acc + n, 0) / scores.length;

     const promedioNormalizado = promedioModulo03 / 3;

     totalPonderado += promedioNormalizado * weight;
   });

   return totalPonderado * 100;
 }

 function calcularPromedioFinalGrupo(grupoReviewsObj) {
   const reviews = Object.values(grupoReviewsObj || {});

   if (!reviews.length) return 0;

   const finales = reviews
     .map(calcularFinalReview)
     .filter(v => !isNaN(v));

   if (!finales.length) return 0;

   return finales.reduce((acc, n) => acc + n, 0) / finales.length;
 }

 // ======================================================
 // DASHBOARD POWERBI
 // ======================================================
 function renderDashboard(data) {
   if (!dashboardEl) return;

   if (!esPowerBI) {
     dashboardEl.innerHTML = "";
     dashboardEl.style.display = "none";
     return;
   }

   dashboardEl.style.display = "";

   if (!data || data.length === 0) {
     dashboardEl.innerHTML = "";
     return;
   }

   dashboardEl.innerHTML = "";
 }

 // ======================================================
 // ACTION PLAN
 // ======================================================
 function abrirActionPlanBU(nombreBUEncoded) {
   if (!nombreBUEncoded) {
     alert("No se encontró la Business Unit.");
     return;
   }

   const nombreBU = decodeURIComponent(nombreBUEncoded);

   window.location.href = `ActionPlan.html?bu=${encodeURIComponent(nombreBU)}`;
 }

 function abrirActionPlanLinea(nombreBUEncoded, nombrePLEncoded) {
   if (!nombreBUEncoded || !nombrePLEncoded) {
     alert("No se encontró la Business Unit o Production Line.");
     return;
   }

   const nombreBU = decodeURIComponent(nombreBUEncoded);
   const nombrePL = decodeURIComponent(nombrePLEncoded);

   window.location.href =
     `ActionPlan.html?bu=${encodeURIComponent(nombreBU)}&pl=${encodeURIComponent(nombrePL)}`;
 }

 window.abrirActionPlanBU = abrirActionPlanBU;
 window.abrirActionPlanLinea = abrirActionPlanLinea;

 // ======================================================
 // RENDER REPORTES
 // BUSINESS UNIT -> PRODUCTION LINE -> REVIEW
 // ======================================================
 function renderBusinessUnits(data) {
   if (!contenedorBusinessUnit) return;

   if (!esReportes) {
     contenedorBusinessUnit.innerHTML = "";
     return;
   }

   contenedorBusinessUnit.innerHTML = "";

   if (!data || data.length === 0) {
     contenedorBusinessUnit.innerHTML = `
<div class="alert alert-light border">
         No hay reportes para mostrar.
</div>
     `;
     return;
   }

   const grupos = agruparPorBUyPLyReview(data);
   const businessUnits = ordenarTextoAsc(Object.keys(grupos));

   if (businessUnits.length === 0) {
     contenedorBusinessUnit.innerHTML = `
<div class="alert alert-light border">
         No hay Business Units disponibles.
</div>
     `;
     return;
   }

   const accordionId = "accordionBusinessUnits";
   let htmlBU = `<div class="accordion" id="${accordionId}">`;

   businessUnits.forEach((nombreBU, indexBU) => {
     const buId = `bu-${crearIdSeguro(nombreBU)}-${indexBU}`;
     const collapseBUId = `collapse-${buId}`;
     const headerBUId = `heading-${buId}`;

     const productionLinesObj = grupos[nombreBU];
     const productionLineNames = ordenarTextoAsc(Object.keys(productionLinesObj));

     const reviewsDeLaBU = {};

     productionLineNames.forEach(nombrePL => {
       Object.entries(productionLinesObj[nombrePL]).forEach(([reviewId, registrosReview]) => {
         reviewsDeLaBU[reviewId] = registrosReview;
       });
     });

     const promedioBU = calcularPromedioFinalGrupo(reviewsDeLaBU);

     let productionLinesHTML = `<div class="accordion mt-3" id="accordion-${buId}">`;

     productionLineNames.forEach((nombrePL, indexPL) => {
       const plId = `pl-${crearIdSeguro(nombrePL)}-${indexBU}-${indexPL}`;
       const collapsePLId = `collapse-${plId}`;
       const headerPLId = `heading-${plId}`;

       const reviewsObj = productionLinesObj[nombrePL];

       const reviewIds = Object.keys(reviewsObj).sort((a, b) => {
         const ra = reviewsObj[a]?.[0];
         const rb = reviewsObj[b]?.[0];

         const da = parsearFechaHora(ra?.fechareview);
         const db = parsearFechaHora(rb?.fechareview);

         if (da && db) return db - da;

         return String(b).localeCompare(String(a));
       });

       const promedioPL = calcularPromedioFinalGrupo(reviewsObj);

       let reviewsHTML = `<div class="accordion mt-2" id="accordion-${plId}">`;

       reviewIds.forEach((reviewId, indexReview) => {
         const registrosReview = reviewsObj[reviewId];
         const reviewBase = registrosReview[0] || {};

         const reviewerNombre =
           reviewBase.usuario && String(reviewBase.usuario).trim() !== ""
             ? String(reviewBase.usuario).trim()
             : "Sin reviewer";

         const fechaHoraTexto = formatearFechaHoraCompleta(reviewBase.fechareview);
         const finalScore = calcularFinalReview(registrosReview);

         const reviewSafeId = crearIdSeguro(`${reviewId}-${indexBU}-${indexPL}-${indexReview}`);
         const headerReviewId = `heading-${reviewSafeId}`;
         const collapseReviewId = `collapse-${reviewSafeId}`;

         let filasHTML = "";

         registrosReview.forEach(r => {
           filasHTML += `
<tr>
<td>${escapeHTML(r.usuario || "-")}</td>
<td>${escapeHTML(r.modulo || "Sin módulo")}</td>
<td>${escapeHTML(r.pregunta || "Sin pregunta")}</td>
<td>
<span class="badge ${obtenerClasePuntuacion(r.puntuacionNumerica)}">
                   ${escapeHTML(redondear(r.puntuacionNumerica))}
</span>
</td>
<td>${escapeHTML(r.comentario || "")}</td>
</tr>
           `;
         });

         reviewsHTML += `
<div class="accordion-item mb-2">
<h2 class="accordion-header" id="${headerReviewId}">
<div class="d-flex align-items-center gap-2 w-100">
<button
                   class="accordion-button collapsed flex-grow-1"
                   type="button"
                   data-bs-toggle="collapse"
                   data-bs-target="#${collapseReviewId}"
                   aria-expanded="false"
                   aria-controls="${collapseReviewId}"
>
<strong>${escapeHTML(fechaHoraTexto)} - ${escapeHTML(reviewerNombre)}</strong>
</button>

<span class="badge ${obtenerClasePuntuacion100(finalScore)} px-3 py-2">
                   Final: ${redondear(finalScore)} / 100
</span>
</div>
</h2>

<div
               id="${collapseReviewId}"
               class="accordion-collapse collapse"
               aria-labelledby="${headerReviewId}"
               data-bs-parent="#accordion-${plId}"
>
<div class="accordion-body">
<div class="table-responsive">
<table class="table table-bordered table-hover align-middle mb-0">
<thead>
<tr>
<th>Usuario</th>
<th>Módulo</th>
<th>Pregunta</th>
<th>Puntuación</th>
<th>Comentario</th>
</tr>
</thead>
<tbody>
                       ${filasHTML}
</tbody>
</table>
</div>
</div>
</div>
</div>
         `;
       });

       reviewsHTML += `</div>`;

       productionLinesHTML += `
<div class="accordion-item mb-2">
<h2 class="accordion-header" id="${headerPLId}">
<div class="d-flex align-items-center w-100">
<button
                 class="accordion-button collapsed flex-grow-1"
                 type="button"
                 data-bs-toggle="collapse"
                 data-bs-target="#${collapsePLId}"
                 aria-expanded="false"
                 aria-controls="${collapsePLId}"
>
<div class="d-flex align-items-center gap-2 flex-wrap w-100">
<strong>${escapeHTML(nombrePL)}</strong>

<span class="badge ${obtenerClasePuntuacion100(promedioPL)}">
                     Promedio línea: ${redondear(promedioPL)} / 100
</span>
</div>
</button>

<button
                 type="button"
                 class="btn btn-sm btn-warning fw-bold ms-2 me-2"
                 onclick="abrirActionPlanLinea('${encodeURIComponent(nombreBU)}', '${encodeURIComponent(nombrePL)}')"
>
                 Plan de Acción
</button>
</div>
</h2>

<div
             id="${collapsePLId}"
             class="accordion-collapse collapse"
             aria-labelledby="${headerPLId}"
             data-bs-parent="#accordion-${buId}"
>
<div class="accordion-body">
               ${reviewsHTML}
</div>
</div>
</div>
       `;
     });

     productionLinesHTML += `</div>`;

     htmlBU += `
<div class="accordion-item mb-3">
<h2 class="accordion-header" id="${headerBUId}">
<div class="d-flex align-items-center w-100">
<button
               class="accordion-button collapsed flex-grow-1"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#${collapseBUId}"
               aria-expanded="false"
               aria-controls="${collapseBUId}"
>
<div class="d-flex align-items-center gap-2 flex-wrap w-100">
<strong>${escapeHTML(nombreBU)}</strong>

<span class="badge ${obtenerClasePuntuacion100(promedioBU)}">
                   Promedio final BU: ${redondear(promedioBU)} / 100
</span>
</div>
</button>

<button
               type="button"
               class="btn btn-sm btn-warning fw-bold ms-2 me-2"
               onclick="abrirActionPlanBU('${encodeURIComponent(nombreBU)}')"
>
               Plan de Acción
</button>
</div>
</h2>

<div
           id="${collapseBUId}"
           class="accordion-collapse collapse"
           aria-labelledby="${headerBUId}"
           data-bs-parent="#${accordionId}"
>
<div class="accordion-body">
             ${productionLinesHTML}
</div>
</div>
</div>
     `;
   });

   htmlBU += `</div>`;

   contenedorBusinessUnit.innerHTML = htmlBU;
 }

 // ======================================================
 // RENDER PLAN DE ACCIÓN
 // BUSINESS UNIT -> PRODUCTION LINE
 // ======================================================
 function renderActionPlanSection(data) {
   if (!contenedorActionPlan) return;

   if (!esReportes) {
     contenedorActionPlan.innerHTML = "";
     return;
   }

   if (!data || data.length === 0) {
     contenedorActionPlan.innerHTML = `
<div class="alert alert-light border">
         No hay información para generar planes de acción.
</div>
     `;
     return;
   }

   const grupos = agruparPorBUyPLyReview(data);
   const businessUnits = ordenarTextoAsc(Object.keys(grupos));

   if (!businessUnits.length) {
     contenedorActionPlan.innerHTML = `
<div class="alert alert-light border">
         No hay Business Units disponibles.
</div>
     `;
     return;
   }

   let html = `<div class="accordion" id="accordionActionPlan">`;

   businessUnits.forEach((nombreBU, indexBU) => {
     const buId = `ap-bu-${crearIdSeguro(nombreBU)}-${indexBU}`;
     const collapseBUId = `collapse-${buId}`;
     const headerBUId = `heading-${buId}`;

     const productionLinesObj = grupos[nombreBU];
     const productionLineNames = ordenarTextoAsc(Object.keys(productionLinesObj));

     const reviewsDeLaBU = {};

     productionLineNames.forEach(nombrePL => {
       Object.entries(productionLinesObj[nombrePL]).forEach(([reviewId, registrosReview]) => {
         reviewsDeLaBU[reviewId] = registrosReview;
       });
     });

     const promedioBU = calcularPromedioFinalGrupo(reviewsDeLaBU);

     let productionLinesHTML = "";

     productionLineNames.forEach((nombrePL) => {
       const reviewsObj = productionLinesObj[nombrePL];
       const promedioPL = calcularPromedioFinalGrupo(reviewsObj);

       productionLinesHTML += `
<div class="border rounded p-3 mb-2 bg-white">
<div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
<div>
<h5 class="mb-1">${escapeHTML(nombrePL)}</h5>

<span class="badge ${obtenerClasePuntuacion100(promedioPL)}">
                 Promedio línea: ${redondear(promedioPL)} / 100
</span>
</div>

<button
               type="button"
               class="btn btn-warning fw-bold"
               onclick="abrirActionPlanLinea('${encodeURIComponent(nombreBU)}', '${encodeURIComponent(nombrePL)}')"
>
               Action Plan
</button>
</div>
</div>
       `;
     });

     html += `
<div class="accordion-item mb-3">
<h2 class="accordion-header" id="${headerBUId}">
<button
             class="accordion-button collapsed"
             type="button"
             data-bs-toggle="collapse"
             data-bs-target="#${collapseBUId}"
             aria-expanded="false"
             aria-controls="${collapseBUId}"
>
<div class="d-flex align-items-center gap-2 flex-wrap w-100">
<strong>${escapeHTML(nombreBU)}</strong>

<span class="badge ${obtenerClasePuntuacion100(promedioBU)}">
                 Promedio final BU: ${redondear(promedioBU)} / 100
</span>
</div>
</button>
</h2>

<div
           id="${collapseBUId}"
           class="accordion-collapse collapse"
           aria-labelledby="${headerBUId}"
           data-bs-parent="#accordionActionPlan"
>
<div class="accordion-body">
<div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3 p-3 border rounded bg-light">
<div>
<h4 class="mb-1">${escapeHTML(nombreBU)}</h4>

<span class="badge ${obtenerClasePuntuacion100(promedioBU)}">
                   Promedio final BU: ${redondear(promedioBU)} / 100
</span>
</div>

<button
                 type="button"
                 class="btn btn-warning fw-bold"
                 onclick="abrirActionPlanBU('${encodeURIComponent(nombreBU)}')"
>
                 Action Plan BU
</button>
</div>

<h5 class="mb-3">Production Lines</h5>

             ${productionLinesHTML || `
<div class="alert alert-light border">
                 No hay Production Lines para esta Business Unit.
</div>
             `}
</div>
</div>
</div>
     `;
   });

   html += `</div>`;

   contenedorActionPlan.innerHTML = html;
 }

 // ======================================================
 // CARGAR REVIEWS
 // ======================================================
 function cargarReviews() {
   setEstadoCarga("Cargando datos...");

   fetch("/api/reviews/todos?t=" + Date.now(), {
     method: "GET",
     cache: "no-store"
   })
     .then(async res => {
       const data = await res.json().catch(() => ({}));

       console.log("Respuesta /api/reviews/todos:", {
         status: res.status,
         ok: res.ok,
         data
       });

       if (!res.ok) {
         throw new Error(
           data.detalle ||
           data.error ||
           data.message ||
           "La respuesta del servidor no fue correcta."
         );
       }

       return data;
     })
     .then(data => {
       console.log("Datos recibidos:", data);

       const rows = Array.isArray(data)
         ? data
         : Array.isArray(data.reviews)
           ? data.reviews
           : Array.isArray(data.data)
             ? data.data
             : [];

       if (!rows || rows.length === 0) {
         renderInfo([]);
         renderDashboard([]);
         renderBusinessUnits([]);
         renderActionPlanSection([]);
         setEstadoCarga("No hay datos.");
         return;
       }

       renderInfo(rows);

       if (esPowerBI) {
         renderDashboard(rows);
       } else {
         renderDashboard([]);
       }

       if (esReportes) {
         renderBusinessUnits(rows);
         renderActionPlanSection(rows);
         aplicarSeccionDesdeHash();
       } else {
         renderBusinessUnits([]);
         renderActionPlanSection([]);
       }

       limpiarEstadoCarga();
     })
     .catch(err => {
       console.error("Error cargando reviews:", err);

       renderInfo([]);
       renderDashboard([]);
       renderBusinessUnits([]);
       renderActionPlanSection([]);

       setEstadoCarga("No se pudieron cargar los datos.");
       alert(err.message || "No se pudieron cargar los datos.");
     });
 }

 // ======================================================
 // INICIO
 // ======================================================
 cargarReviews();
});
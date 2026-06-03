document.addEventListener("DOMContentLoaded", function () {
  // ======================================================
  // CONFIGURACIÓN DE MÓDULOS SEGÚN EXCEL
  // ======================================================
  const MODULES = [
    {
      id: "1.0 Manufacturing Strategy",
      shortName: "Manufacturing Strategy",
      impact: 0.30,
      questions: [1, 2, 3, 4, 5, 6, 7, 8]
    },
    {
      id: "2.0 Foundations",
      shortName: "Foundations",
      impact: 0.40,
      questions: [9, 10, 11, 12, 13, 14, 15, 16]
    },
    {
      id: "3.0 High Performance Teams",
      shortName: "High Performance Teams",
      impact: 0.10,
      questions: [17]
    },
    {
      id: "4.0 Quality at Source",
      shortName: "Quality at Source",
      impact: 0.05,
      questions: [18, 19, 20, 21]
    },
    {
      id: "5.0 Safety First",
      shortName: "Safety First",
      impact: 0.10,
      questions: [22, 23, 24, 25]
    },
    {
      id: "6.0 Design Improvement",
      shortName: "Design Improvement",
      impact: 0.05,
      questions: [26, 27]
    }
  ];

  const QUESTION_TO_MODULE = {};

  MODULES.forEach(module => {
    module.questions.forEach(q => {
      QUESTION_TO_MODULE[q] = module.id;
    });
  });

  // ======================================================
  // ELEMENTOS
  // ======================================================
  const fechaHoyEl = document.getElementById("fechaHoy");
  const estadoCargaEl = document.getElementById("estadoCarga");

  const filtroBU = document.getElementById("filtroBU");
  const filtroPL = document.getElementById("filtroPL");
  const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

  const btnLimpiarMesHistorico = document.getElementById("btnLimpiarMesHistorico");
  const textoMesSeleccionado = document.getElementById("textoMesSeleccionado");

  // Compatibilidad por si aún tienes IDs viejos
  const kpiGeneralLabel =
    document.getElementById("kpiGeneralLabel") ||
    document.getElementById("kpiMejorBU");

  const kpiGeneralScore =
    document.getElementById("kpiGeneralScore") ||
    document.getElementById("kpiMejorBUScore");

  const tablaFechaBody = document.getElementById("tablaFechaBody");

  const toggleSidebarBtn = document.getElementById("toggleSidebar");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  // Elementos viejos por si siguen en el HTML
  const uaFecha = document.getElementById("uaFecha");
  const uaUsuario = document.getElementById("uaUsuario");
  const uaBU = document.getElementById("uaBU");
  const uaPL = document.getElementById("uaPL");
  const uaScore = document.getElementById("uaScore");
  const kpiPeorPL = document.getElementById("kpiPeorPL");
  const kpiPeorPLScore = document.getElementById("kpiPeorPLScore");
  const tablaBUBody = document.getElementById("tablaBUBody");

  let chartLinea = null;
  let chartBarras = null;

  let registrosBase = [];
  let dashboardActual = null;

  // Filtro mensual al hacer clic en una barra del histórico
  let mesSeleccionadoHistorico = "";

  // ======================================================
  // SIDEBAR
  // ======================================================
  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener("click", function () {
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

  if (sidebarOverlay && sidebar) {
    sidebarOverlay.addEventListener("click", function () {
      sidebar.classList.remove("mobile-open");
      sidebarOverlay.classList.remove("show");
    });
  }

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
  // UTILIDADES
  // ======================================================
  function setEstado(mensaje = "") {
    if (estadoCargaEl) {
      estadoCargaEl.textContent = mensaje;
    }
  }

  function redondear(num, decimales = 2) {
    return Number(num || 0).toFixed(decimales);
  }

  function escapeHTML(valor) {
    if (valor === null || valor === undefined) return "";

    return String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizarTexto(valor) {
    return String(valor || "").trim();
  }

  function extraerPartesFecha(fecha) {
    if (!fecha) return null;

    const texto = String(fecha).trim();

    // YYYY-MM-DD...
    let match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3])
      };
    }

    // DD/MM/YYYY o DD-MM-YYYY
    match = texto.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);

    if (match) {
      return {
        day: Number(match[1]),
        month: Number(match[2]),
        year: Number(match[3])
      };
    }

    return null;
  }

  function obtenerFechaKey(fecha) {
    const partes = extraerPartesFecha(fecha);

    if (!partes) return "sin-fecha";

    return `${String(partes.year)}-${String(partes.month).padStart(2, "0")}-${String(partes.day).padStart(2, "0")}`;
  }

  function obtenerMesKey(fecha) {
    const partes = extraerPartesFecha(fecha);

    if (!partes) return "sin-fecha";

    return `${partes.year}-${String(partes.month).padStart(2, "0")}`;
  }

  function mesKeyToDate(mesKey) {
    if (!mesKey || mesKey === "sin-fecha") return null;

    const [y, m] = String(mesKey).split("-").map(Number);

    if (!y || !m) return null;

    return new Date(y, m - 1, 1);
  }

  function formatearMes(mesKey) {
    const d = mesKeyToDate(mesKey);

    if (!d) return "Sin fecha";

    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long"
    });
  }

  function actualizarTextoMesSeleccionado() {
    if (!textoMesSeleccionado) return;

    if (!mesSeleccionadoHistorico) {
      textoMesSeleccionado.textContent = "Promedio final por mes";
      return;
    }

    textoMesSeleccionado.textContent = `Filtrado por ${formatearMes(mesSeleccionadoHistorico)}`;
  }

  function claseScore(score) {
    if (score >= 85) return "green";
    if (score >= 70) return "blue";
    if (score >= 50) return "";

    return "red";
  }

  function obtenerNumeroPregunta(registro) {
    const candidatos = [
      registro.idpregunta,
      registro.idPregunta,
      registro.IdPregunta,
      registro.questionId,
      registro.question_id,
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

  function getAuditKey(registroNormalizado) {
    const reviewId = normalizarTexto(registroNormalizado.idreview);

    if (reviewId !== "") return `review-${reviewId}`;

    return [
      registroNormalizado.fechaKey || "sin-fecha",
      normalizarTexto(registroNormalizado.usuario) || "sin-usuario",
      normalizarTexto(registroNormalizado.businessunit) || "sin-bu",
      normalizarTexto(registroNormalizado.productionline) || "sin-pl"
    ].join("|");
  }

  function ocultarTarjetaDeElemento(el) {
    if (!el) return;

    const candidato =
      el.closest(".dashboard-panel") ||
      el.closest(".kpi-card-modern") ||
      el.closest(".content-card") ||
      el.closest(".card") ||
      el.closest(".col") ||
      el.parentElement?.parentElement ||
      el.parentElement;

    if (candidato) {
      candidato.style.display = "none";
    }
  }

  function ocultarSeccionesNoDeseadas() {
    // Última auditoría encontrada
    if (uaFecha) ocultarTarjetaDeElemento(uaFecha);
    if (uaUsuario) ocultarTarjetaDeElemento(uaUsuario);
    if (uaBU) ocultarTarjetaDeElemento(uaBU);
    if (uaPL) ocultarTarjetaDeElemento(uaPL);
    if (uaScore) ocultarTarjetaDeElemento(uaScore);

    // Peor production line
    if (kpiPeorPL) ocultarTarjetaDeElemento(kpiPeorPL);
    if (kpiPeorPLScore) ocultarTarjetaDeElemento(kpiPeorPLScore);

    // Tabla vieja de últimas auditorías
    if (tablaBUBody) {
      const wrap =
        tablaBUBody.closest(".dashboard-panel") ||
        tablaBUBody.closest(".content-card") ||
        tablaBUBody.closest(".card") ||
        tablaBUBody.closest(".col") ||
        tablaBUBody.parentElement?.parentElement;

      if (wrap) wrap.style.display = "none";
    }
  }

  // ======================================================
  // NORMALIZACIÓN
  // ======================================================
  function normalizarRegistro(registro) {
    const fechaOriginal =
      registro.fechareview ??
      registro.fechaReview ??
      registro.FechaReview ??
      registro.fecha ??
      "";

    const numeroPregunta = obtenerNumeroPregunta(registro);

    return {
      idreview: registro.idreview ?? registro.idReview ?? registro.review_id ?? "",
      fechareview: fechaOriginal,
      usuario: registro.usuario ?? registro.reviewer ?? registro.auditor ?? "",
      businessunit: registro.businessunit ?? registro.businessUnit ?? registro.bu ?? "Sin Business Unit",
      productionline: registro.productionline ?? registro.productionLine ?? registro.linea ?? "Sin Production Line",
      pregunta: numeroPregunta,
      puntuacion: registro.puntuacion ?? registro.score ?? registro.calificacion ?? 0,
      comentario: registro.comentario ?? registro.comments ?? "",
      fechaKey: obtenerFechaKey(fechaOriginal),
      mesKey: obtenerMesKey(fechaOriginal)
    };
  }

  function obtenerPuntuacion03(registro) {
    const valor = Number(registro.puntuacion);

    if (!isNaN(valor) && valor >= 0) {
      return Math.max(0, Math.min(3, valor));
    }

    return 0;
  }

  // ======================================================
  // CÁLCULO DE MÓDULOS PONDERADOS
  // ======================================================
  function calcularMetricasPonderadas(registros) {
    const modulos = MODULES.map(module => {
      const registrosModulo = registros.filter(r => QUESTION_TO_MODULE[r.pregunta] === module.id);

      const sumaPuntos = registrosModulo.reduce((acc, r) => acc + obtenerPuntuacion03(r), 0);
      const maximoPosible = registrosModulo.length * 3;

      const scoreModulo100 = maximoPosible > 0
        ? (sumaPuntos / maximoPosible) * 100
        : 0;

      return {
        ...module,
        registros: registrosModulo.length,
        rawPoints: sumaPuntos,
        maxPoints: maximoPosible,
        score100: scoreModulo100,
        weightedScore: scoreModulo100 * module.impact
      };
    });

    const scoreTotal100 = modulos.reduce((acc, m) => acc + m.weightedScore, 0);

    return {
      modulos,
      scoreTotal100
    };
  }

  // ======================================================
  // AGRUPACIONES
  // ======================================================
  function agruparScorePonderado(registros, campo) {
    const grupos = {};

    registros.forEach(r => {
      const key = r[campo] && String(r[campo]).trim() !== ""
        ? String(r[campo]).trim()
        : `Sin ${campo}`;

      if (!grupos[key]) {
        grupos[key] = [];
      }

      grupos[key].push(r);
    });

    return Object.entries(grupos)
      .map(([nombre, items]) => {
        const met = calcularMetricasPonderadas(items);
        const auditorias = new Set(items.map(x => getAuditKey(x))).size;

        return {
          nombre,
          promedio: met.scoreTotal100,
          cantidad: items.length,
          auditorias
        };
      })
      .sort((a, b) => b.promedio - a.promedio);
  }

  function agruparScorePonderadoPorMes(registros) {
    const grupos = {};

    registros.forEach(r => {
      const key = r.mesKey || "sin-fecha";

      if (!grupos[key]) grupos[key] = [];

      grupos[key].push(r);
    });

    return Object.entries(grupos)
      .map(([mesKey, items]) => {
        const met = calcularMetricasPonderadas(items);
        const auditorias = new Set(items.map(x => getAuditKey(x))).size;

        return {
          mesKey,
          mesTexto: mesKey === "sin-fecha" ? "Sin fecha" : formatearMes(mesKey),
          promedio: met.scoreTotal100,
          cantidad: items.length,
          auditorias
        };
      })
      .sort((a, b) => {
        const da = mesKeyToDate(a.mesKey);
        const db = mesKeyToDate(b.mesKey);

        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;

        return da - db;
      });
  }

  function agruparAuditorias(registros) {
    const grupos = {};

    registros.forEach(r => {
      const key = getAuditKey(r);

      if (!grupos[key]) grupos[key] = [];

      grupos[key].push(r);
    });

    return Object.entries(grupos)
      .map(([auditKey, items]) => {
        const base = items[0] || {};
        const met = calcularMetricasPonderadas(items);

        return {
          auditKey,
          idreview: normalizarTexto(base.idreview) || auditKey,
          fechaKey: base.fechaKey || "sin-fecha",
          mesKey: base.mesKey || "sin-fecha",
          usuario: normalizarTexto(base.usuario) || "Sin usuario",
          businessunit: normalizarTexto(base.businessunit) || "Sin Business Unit",
          productionline: normalizarTexto(base.productionline) || "Sin Production Line",
          registros: items,
          promedioFinal: met.scoreTotal100,
          moduleBreakdown: met.modulos
        };
      });
  }

  // ======================================================
  // FILTROS
  // ======================================================
  function obtenerBusinessUnits(registros) {
    return [...new Set(
      registros.map(r => normalizarTexto(r.businessunit)).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }

  function obtenerProductionLinesPorBU(registros, businessUnit) {
    return [...new Set(
      registros
        .filter(r => !businessUnit || normalizarTexto(r.businessunit) === businessUnit)
        .map(r => normalizarTexto(r.productionline))
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }

  function poblarFiltroBU(registros) {
    if (!filtroBU) return;

    const bus = obtenerBusinessUnits(registros);

    filtroBU.innerHTML = `
      <option value="">Todas las Business Units</option>
      ${bus.map(bu => `<option value="${escapeHTML(bu)}">${escapeHTML(bu)}</option>`).join("")}
    `;
  }

  function poblarFiltroPL(registros, businessUnitSeleccionada = "", plSeleccionada = "") {
    if (!filtroPL) return;

    const lines = obtenerProductionLinesPorBU(registros, businessUnitSeleccionada);

    if (!businessUnitSeleccionada) {
      filtroPL.innerHTML = `<option value="">Selecciona una Business Unit primero</option>`;
      filtroPL.disabled = true;
      return;
    }

    filtroPL.disabled = false;

    filtroPL.innerHTML = `
      <option value="">Todas las Production Lines</option>
      ${lines.map(pl => `<option value="${escapeHTML(pl)}">${escapeHTML(pl)}</option>`).join("")}
    `;

    if (plSeleccionada && lines.includes(plSeleccionada)) {
      filtroPL.value = plSeleccionada;
    }
  }

  function filtrarRegistros(registros, bu, pl, mesKey = "") {
    return registros.filter(r => {
      const matchBU = !bu || normalizarTexto(r.businessunit) === bu;
      const matchPL = !pl || normalizarTexto(r.productionline) === pl;
      const matchMes = !mesKey || r.mesKey === mesKey;

      return matchBU && matchPL && matchMes;
    });
  }

  // ======================================================
  // PREPARAR DATA
  // ======================================================
  function prepararData(registros) {
    const totalRegistros = registros.length;
    const metGlobal = calcularMetricasPonderadas(registros);
    const promediosBU = agruparScorePonderado(registros, "businessunit");
    const promediosPL = agruparScorePonderado(registros, "productionline");
    const promediosMes = agruparScorePonderadoPorMes(registros);
    const auditorias = agruparAuditorias(registros);

    return {
      registros,
      totalRegistros,
      promedioGeneral: metGlobal.scoreTotal100,
      promediosBU,
      promediosPL,
      promediosMes,
      auditorias,
      totalAuditorias: auditorias.length,
      moduleBreakdownGeneral: metGlobal.modulos
    };
  }

  // ======================================================
  // KPIS
  // ======================================================
  function renderKPIs(met) {
    const buSeleccionada = filtroBU ? normalizarTexto(filtroBU.value) : "";
    const plSeleccionada = (filtroPL && !filtroPL.disabled) ? normalizarTexto(filtroPL.value) : "";

    if (kpiGeneralLabel) {
      if (buSeleccionada && plSeleccionada && mesSeleccionadoHistorico) {
        kpiGeneralLabel.textContent = `${buSeleccionada} - ${plSeleccionada} / ${formatearMes(mesSeleccionadoHistorico)}`;
      } else if (buSeleccionada && plSeleccionada) {
        kpiGeneralLabel.textContent = `${buSeleccionada} - ${plSeleccionada}`;
      } else if (buSeleccionada && mesSeleccionadoHistorico) {
        kpiGeneralLabel.textContent = `${buSeleccionada} / ${formatearMes(mesSeleccionadoHistorico)}`;
      } else if (buSeleccionada) {
        kpiGeneralLabel.textContent = buSeleccionada;
      } else if (mesSeleccionadoHistorico) {
        kpiGeneralLabel.textContent = formatearMes(mesSeleccionadoHistorico);
      } else {
        kpiGeneralLabel.textContent = "General";
      }
    }

    if (kpiGeneralScore) {
      kpiGeneralScore.textContent = redondear(met.promedioGeneral);
    }
  }

  // ======================================================
  // TABLA MÓDULOS GENERAL
  // ======================================================
  function renderTablaFecha(met) {
    if (!tablaFechaBody) return;

    const modulos = met.moduleBreakdownGeneral || [];

    if (!modulos.length) {
      tablaFechaBody.innerHTML = `
        <tr>
          <td colspan="4">Sin datos</td>
        </tr>
      `;
      return;
    }

    tablaFechaBody.innerHTML = modulos.map(mod => `
      <tr>
        <td>${escapeHTML(mod.shortName)}</td>
        <td>
          <span class="score-pill ${claseScore(mod.score100)}">
            ${redondear(mod.score100)}
          </span>
        </td>
        <td>${redondear(mod.impact * 100, 0)}%</td>
        <td>${redondear(mod.weightedScore)}</td>
      </tr>
    `).join("");
  }

  // ======================================================
  // CHARTS
  // ======================================================
  function destruirCharts() {
    if (chartLinea) {
      chartLinea.destroy();
      chartLinea = null;
    }

    if (chartBarras) {
      chartBarras.destroy();
      chartBarras = null;
    }
  }

  // ======================================================
// PLUGIN PARA MOSTRAR CALIFICACIÓN DENTRO DE LAS BARRAS
// ======================================================
const barValueLabelsPlugin = {
  id: "barValueLabelsPlugin",

  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    ctx.save();

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      if (!meta || meta.hidden) return;

      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];

        if (value === null || value === undefined || value === "") return;

        const text = Number(value).toFixed(2);

        const props = bar.getProps(["x", "y", "base", "width"], true);

        const x = props.x;
        const y = props.y + 22;

        const paddingX = 8;
        const paddingY = 5;

        ctx.font = "800 13px Segoe UI, Arial, sans-serif";

        const textWidth = ctx.measureText(text).width;
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = 24;
        const radius = 999;

        const boxX = x - boxWidth / 2;
        const boxY = y - boxHeight / 2;

        // Fondo tipo etiqueta dentro de la barra
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
        ctx.fill();

        // Texto de la calificación
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x, y);
      });
    });

    ctx.restore();
  }
};

  function renderCharts(met, metPL = met, metHistorico = met) {
    destruirCharts();

    const ctxLinea = document.getElementById("chartLinea");
    const ctxBarras = document.getElementById("chartBarras");

    // ======================================================
    // HISTÓRICO MENSUAL EN BARRAS
    // ======================================================
    if (ctxLinea) {
      const datosMes = metHistorico.promediosMes || [];

    chartLinea = new Chart(ctxLinea, {
      type: "bar",
      data: {
        labels: datosMes.map(x => x.mesTexto),
        datasets: [
          {
            label: "Promedio mensual",
            data: datosMes.map(x => Number(redondear(x.promedio))),
            backgroundColor: datosMes.map(x => {
              return x.mesKey === mesSeleccionadoHistorico
                ? "rgba(37, 99, 235, 0.95)"
                : "rgba(96, 165, 250, 0.65)";
            }),
            borderColor: datosMes.map(x => {
              return x.mesKey === mesSeleccionadoHistorico
                ? "#1d4ed8"
                : "#60a5fa";
            }),
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 70
          }
        ]
      },

      plugins: [barValueLabelsPlugin],

      options: {
          maintainAspectRatio: false,
          responsive: true,
          onClick: function (event, elements) {
            if (!elements.length) return;

            const index = elements[0].index;
            const mesSeleccionado = datosMes[index];

            if (!mesSeleccionado) return;

            mesSeleccionadoHistorico = mesSeleccionado.mesKey;

            actualizarTextoMesSeleccionado();
            aplicarFiltrosDashboard();
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `Promedio mensual: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: { stepSize: 10 },
              grid: { color: "rgba(148,163,184,0.18)" }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // ======================================================
    // BARRAS = TODAS LAS PRODUCTION LINES
    // Respeta BU y mes seleccionado, pero ignora PL
    // ======================================================
    if (ctxBarras) {
      const topPL = metPL.promediosPL || [];

      const colores = [
        "#60a5fa",
        "#818cf8",
        "#38bdf8",
        "#a78bfa",
        "#22c55e",
        "#f59e0b",
        "#fb7185",
        "#34d399",
        "#f87171",
        "#2dd4bf",
        "#fbbf24",
        "#c084fc",
        "#4ade80",
        "#fb7185",
        "#38bdf8",
        "#a3e635",
        "#f97316",
        "#06b6d4",
        "#8b5cf6",
        "#14b8a6"
      ];

      chartBarras = new Chart(ctxBarras, {
        type: "bar",
        data: {
          labels: topPL.map(x => x.nombre),
          datasets: [
            {
              label: "Promedio general",
              data: topPL.map(x => Number(redondear(x.promedio))),
              backgroundColor: topPL.map((_, i) => colores[i % colores.length]),
              borderRadius: 8,
              maxBarThickness: 42
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: { stepSize: 10 },
              grid: { color: "rgba(148,163,184,0.18)" }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  }

  // ======================================================
  // LIMPIAR VISTA
  // ======================================================
  function limpiarVistaSinDatos() {
    if (kpiGeneralLabel) kpiGeneralLabel.textContent = "General";
    if (kpiGeneralScore) kpiGeneralScore.textContent = "0.00";

    if (tablaFechaBody) {
      tablaFechaBody.innerHTML = `<tr><td colspan="4">Sin datos</td></tr>`;
    }

    destruirCharts();
  }

  // ======================================================
  // APLICAR FILTROS
  // ======================================================
  function aplicarFiltrosDashboard() {
    const buSeleccionada = filtroBU ? filtroBU.value : "";
    const plSeleccionada = filtroPL && !filtroPL.disabled ? filtroPL.value : "";

    actualizarTextoMesSeleccionado();

    // KPI, tabla de módulos y métricas generales:
    // respetan BU, PL y mes seleccionado
    const registrosFiltrados = filtrarRegistros(
      registrosBase,
      buSeleccionada,
      plSeleccionada,
      mesSeleccionadoHistorico
    );

    if (!registrosFiltrados.length) {
      setEstado("No hay datos para los filtros seleccionados.");
      limpiarVistaSinDatos();
      return;
    }

    // Histórico mensual:
    // respeta BU y PL, pero NO se reduce al mes seleccionado
    // para que sigas viendo todas las barras del histórico
    const registrosParaHistorico = filtrarRegistros(
      registrosBase,
      buSeleccionada,
      plSeleccionada,
      ""
    );

    // Top Production Line:
    // respeta BU y mes seleccionado, pero ignora PL
    // para mostrar todas las líneas dentro de la BU
    const registrosParaGraficaPL = filtrarRegistros(
      registrosBase,
      buSeleccionada,
      "",
      mesSeleccionadoHistorico
    );

    const met = prepararData(registrosFiltrados);
    const metPL = prepararData(registrosParaGraficaPL);
    const metHistorico = prepararData(registrosParaHistorico);

    dashboardActual = met;

    renderKPIs(met);
    renderTablaFecha(met);
    renderCharts(met, metPL, metHistorico);

    setEstado("");
  }

  // ======================================================
  // EVENTOS FILTROS
  // ======================================================
  if (filtroBU) {
    filtroBU.addEventListener("change", function () {
      const bu = filtroBU.value;

      poblarFiltroPL(registrosBase, bu, "");
      aplicarFiltrosDashboard();
    });
  }

  if (filtroPL) {
    filtroPL.addEventListener("change", function () {
      aplicarFiltrosDashboard();
    });
  }

  if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener("click", function () {
      if (filtroBU) filtroBU.value = "";

      if (filtroPL) {
        filtroPL.innerHTML = `<option value="">Selecciona una Business Unit primero</option>`;
        filtroPL.disabled = true;
      }

      mesSeleccionadoHistorico = "";

      actualizarTextoMesSeleccionado();
      aplicarFiltrosDashboard();
    });
  }

  if (btnLimpiarMesHistorico) {
    btnLimpiarMesHistorico.addEventListener("click", function () {
      mesSeleccionadoHistorico = "";

      actualizarTextoMesSeleccionado();
      aplicarFiltrosDashboard();
    });
  }

  // ======================================================
  // CARGAR DASHBOARD
  // ======================================================
  function cargarDashboard() {
    setEstado("Cargando dashboard...");
    ocultarSeccionesNoDeseadas();

    fetch("/api/reviews/todos?t=" + Date.now(), {
      method: "GET",
      cache: "no-store"
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));

        console.log("Respuesta /api/reviews/todos dashboard:", {
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
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data.reviews)
            ? data.reviews
            : Array.isArray(data.data)
              ? data.data
              : [];

        console.log("Datos recibidos para dashboard:", rows);

        if (!rows || rows.length === 0) {
          setEstado("No hay datos para mostrar.");
          limpiarVistaSinDatos();
          return;
        }

        registrosBase = rows
          .map(normalizarRegistro)
          .filter(r => r.pregunta !== null);

        console.log("Registros normalizados dashboard:", registrosBase);

        if (!registrosBase.length) {
          setEstado("No hay datos válidos para mostrar.");
          limpiarVistaSinDatos();
          return;
        }

        poblarFiltroBU(registrosBase);
        poblarFiltroPL(registrosBase, "", "");

        mesSeleccionadoHistorico = "";

        if (typeof actualizarTextoMesSeleccionado === "function") {
          actualizarTextoMesSeleccionado();
        }

        aplicarFiltrosDashboard();

        setEstado("");
      })
      .catch(error => {
        console.error("Error dashboard:", error);

        setEstado(
          error.message ||
          "No se pudieron cargar los datos del dashboard."
        );

        limpiarVistaSinDatos();
      });
  }

  // ======================================================
  // INICIO
  // ======================================================
  cargarDashboard();
});
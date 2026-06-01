(function () {
  "use strict";

  // ======================================================
  // CONFIG GENERAL
  // ======================================================
  const APP_CONFIG_KEY = "appConfig";
  const API_BASE = "http://localhost:3000";

  // Fallback local por si el endpoint de módulos no existe
  const MODULOS_FALLBACK = [
    { id: "1", name: "Manufacturing Strategy" },
    { id: "2", name: "Lean Foundations" },
    { id: "3", name: "High Performance Teams" },
    { id: "4", name: "Quality at Source" },
    { id: "5", name: "Safety First" },
    { id: "6", name: "Design Improvement" }
  ];

  // ======================================================
  // INIT
  // ======================================================
  document.addEventListener("DOMContentLoaded", async function () {
    const hasSettingsPage =
      document.getElementById("questionsTableBody") ||
      document.getElementById("usersTableBody") ||
      document.getElementById("businessUnitsTableBody") ||
      document.getElementById("productionLinesTableBody");

    if (!hasSettingsPage) return;

    initializeConfig();
    initTabs();
    bindEvents();

    renderAll();

    await cargarUsuariosDesdeBD();
    await cargarModulosDesdeBD();
    await cargarPreguntasDesdeBD();
    await cargarBusinessUnitsDesdeBD();
    await cargarProductionLinesDesdeBD();

    renderAll();
  });

  // ======================================================
  // STORAGE / HELPERS
  // ======================================================
  function getDefaultConfig() {
    return {
      questions: [],
      users: [],
      businessUnits: [],
      productionLines: [],
      modules: []
    };
  }

  function getConfig() {
    try {
      const raw = localStorage.getItem(APP_CONFIG_KEY);
      if (!raw) return getDefaultConfig();

      const parsed = JSON.parse(raw);

      return {
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        businessUnits: Array.isArray(parsed.businessUnits) ? parsed.businessUnits : [],
        productionLines: Array.isArray(parsed.productionLines) ? parsed.productionLines : [],
        modules: Array.isArray(parsed.modules) ? parsed.modules : []
      };
    } catch (error) {
      console.error("Error leyendo appConfig:", error);
      return getDefaultConfig();
    }
  }

  function saveConfig(config) {
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(config));
  }

  function generateId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showEmptyRow(colspan, text) {
    return `
      <tr>
        <td colspan="${colspan}">
          <div class="settings-empty">${escapeHTML(text)}</div>
        </td>
      </tr>
    `;
  }

  function safeSetValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
  }

  function safeGetValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  // ======================================================
  // MAPPERS DESDE BD
  // ======================================================
  function mapUserFromDb(u) {
    return {
      id: String(
        u.id ??
        u.IdUsuario ??
        u.idusuario ??
        u.usuario_id ??
        generateId("usr")
      ),
      name: String(u.name ?? u.Nombre ?? u.nombre ?? "").trim(),
      username: String(u.username ?? u.Usuario ?? u.usuario ?? "").trim(),
      password: String(u.password ?? u.Contrasena ?? u.contrasena ?? "").trim(),
      email: String(u.email ?? u.Correo ?? u.correo ?? "").trim(),
      role: String(u.role ?? u.Rol ?? u.rol ?? "").trim().toLowerCase(),
      active: true
    };
  }

  function mapModuleFromDb(m) {
    return {
      id: String(m.idmodulo ?? m.id ?? ""),
      name: String(m.nombre ?? m.name ?? "").trim()
    };
  }

  function mapQuestionFromDb(q, modules = []) {
    const moduleId = String(q.idmodulo ?? q.moduleId ?? q.idModulo ?? "");
    const moduleNameFromRow = String(q.modulo ?? q.module ?? q.nombre_modulo ?? "").trim();
    const moduleFound = modules.find(m => String(m.id) === moduleId);

    return {
      id: String(q.idpregunta ?? q.id ?? generateId("q")),
      text: String(q.texto ?? q.text ?? "").trim(),
      moduleId,
      moduleName: moduleNameFromRow || (moduleFound ? moduleFound.name : ""),
      order: Number(q.orden ?? q.order ?? 0) || 0
    };
  }

  function mapBusinessUnitFromDb(b) {
    return {
      id: String(b.idbusinessunit ?? b.id ?? ""),
      name: String(b.nombre ?? b.name ?? "").trim()
    };
  }

  function mapProductionLineFromDb(p) {
    return {
      id: String(p.idproductionline ?? p.id ?? ""),
      name: String(p.nombre ?? p.name ?? "").trim(),
      businessUnitId: String(p.idbusinessunit ?? p.businessUnitId ?? ""),
      businessUnitName: String(p.businessunit ?? p.businessUnit ?? "").trim()
    };
  }

  // ======================================================
  // INITIALIZE CONFIG
  // ======================================================
  function initializeConfig() {
    const config = getConfig();

    if (!Array.isArray(config.questions)) config.questions = [];
    if (!Array.isArray(config.users)) config.users = [];
    if (!Array.isArray(config.businessUnits)) config.businessUnits = [];
    if (!Array.isArray(config.productionLines)) config.productionLines = [];
    if (!Array.isArray(config.modules)) config.modules = [];

    if (!config.modules.length) {
      config.modules = [...MODULOS_FALLBACK];
    }

    saveConfig(config);
  }

  // ======================================================
  // CARGAR DESDE BASE DE DATOS
  // ======================================================
  async function cargarUsuariosDesdeBD() {
    try {
      const res = await fetch(`${API_BASE}/api/usuarios`);
      if (!res.ok) throw new Error("No se pudieron obtener usuarios desde la base de datos.");

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("La respuesta de usuarios no es un arreglo.");

      const config = getConfig();
      config.users = data.map(mapUserFromDb);

      saveConfig(config);
      renderUsers();
    } catch (error) {
      console.error("❌ Error cargando usuarios desde BD:", error);
      renderUsers();
    }
  }

  async function cargarModulosDesdeBD() {
    try {
      const res = await fetch(`${API_BASE}/api/modulos`);

      if (!res.ok) {
        throw new Error("No se pudieron obtener módulos desde la base de datos.");
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("La respuesta de módulos no es un arreglo.");
      }

      const config = getConfig();
      config.modules = data.map(mapModuleFromDb);

      saveConfig(config);
      fillQuestionModuleSelect();
    } catch (error) {
      console.warn("⚠️ Usando módulos fallback:", error.message);

      const config = getConfig();

      if (!config.modules.length) {
        config.modules = [...MODULOS_FALLBACK];
        saveConfig(config);
      }

      fillQuestionModuleSelect();
    }
  }

  async function cargarPreguntasDesdeBD() {
    try {
      const res = await fetch(`${API_BASE}/api/preguntas?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store"
      });

      if (!res.ok) throw new Error("No se pudieron obtener preguntas desde la base de datos.");

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("La respuesta de preguntas no es un arreglo.");
      }

      const config = getConfig();
      const modules = Array.isArray(config.modules) ? config.modules : [];

      config.questions = data.map(q => mapQuestionFromDb(q, modules));

      saveConfig(config);
      renderQuestions();
    } catch (error) {
      console.error("❌ Error cargando preguntas desde BD:", error);
      renderQuestions();
    }
  }

  async function cargarBusinessUnitsDesdeBD() {
    try {
      const res = await fetch(`${API_BASE}/api/business-units`);

      if (!res.ok) {
        throw new Error("No se pudieron obtener Business Units desde la base de datos.");
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("La respuesta de Business Units no es un arreglo.");
      }

      const config = getConfig();
      config.businessUnits = data.map(mapBusinessUnitFromDb);

      saveConfig(config);
      fillBusinessUnitSelect();
      renderBusinessUnits();
    } catch (error) {
      console.error("❌ Error cargando Business Units desde BD:", error);
      fillBusinessUnitSelect();
      renderBusinessUnits();
    }
  }

  async function cargarProductionLinesDesdeBD() {
    try {
      const res = await fetch(`${API_BASE}/api/production-lines`);

      if (!res.ok) {
        throw new Error("No se pudieron obtener Production Lines desde la base de datos.");
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("La respuesta de Production Lines no es un arreglo.");
      }

      const config = getConfig();
      config.productionLines = data.map(mapProductionLineFromDb);

      saveConfig(config);
      renderProductionLines();
      renderBusinessUnits();
    } catch (error) {
      console.error("❌ Error cargando Production Lines desde BD:", error);
      renderProductionLines();
      renderBusinessUnits();
    }
  }

  // ======================================================
  // TABS
  // ======================================================
  function initTabs() {
    const buttons = document.querySelectorAll(".settings-tab-btn");

    const panelIds = [
      "tab-questions",
      "tab-users",
      "tab-businessUnits",
      "tab-productionLines"
    ];

    function hideAllPanels() {
      panelIds.forEach((id) => {
        const panel = document.getElementById(id);
        if (!panel) return;

        panel.classList.add("d-none");
        panel.style.display = "none";
      });
    }

    function showPanel(id) {
      const panel = document.getElementById(id);
      if (!panel) return;

      panel.classList.remove("d-none");
      panel.style.display = "block";
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const tab = btn.dataset.tab;

        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        hideAllPanels();
        showPanel(`tab-${tab}`);
      });
    });

    hideAllPanels();
    showPanel("tab-questions");
  }

  // ======================================================
  // EVENTS
  // ======================================================
  function bindEvents() {
    // Preguntas
    document.getElementById("saveQuestionBtn")?.addEventListener("click", saveQuestion);
    document.getElementById("clearQuestionBtn")?.addEventListener("click", clearQuestionForm);

    // Cuando cambies el módulo, filtra la tabla de preguntas
    document.getElementById("questionModule")?.addEventListener("change", function () {
      safeSetValue("questionId", "");
      safeSetValue("questionText", "");
      safeSetValue("questionOrder", "");

      renderQuestions();
    });

    // Usuarios
    document.getElementById("saveUserBtn")?.addEventListener("click", saveUser);
    document.getElementById("clearUserBtn")?.addEventListener("click", clearUserForm);

    // Business Units
    document.getElementById("saveBusinessUnitBtn")?.addEventListener("click", saveBusinessUnit);
    document.getElementById("clearBusinessUnitBtn")?.addEventListener("click", clearBusinessUnitForm);

    // Production Lines
    document.getElementById("saveProductionLineBtn")?.addEventListener("click", saveProductionLine);
    document.getElementById("clearProductionLineBtn")?.addEventListener("click", clearProductionLineForm);
  }

  // ======================================================
  // RENDER ALL
  // ======================================================
  function renderAll() {
    fillQuestionModuleSelect();
    fillBusinessUnitSelect();
    renderQuestions();
    renderUsers();
    renderBusinessUnits();
    renderProductionLines();
  }

  // ======================================================
  // PREGUNTAS
  // ======================================================
  function fillQuestionModuleSelect() {
    const select = document.getElementById("questionModule");
    if (!select) return;

    const config = getConfig();
    const modules = Array.isArray(config.modules) ? config.modules : [];

    const current = select.value || "";

    select.innerHTML = `
      <option value="">Selecciona un módulo</option>
      ${modules
        .map(m => `<option value="${escapeHTML(m.id)}">${escapeHTML(m.name)}</option>`)
        .join("")}
    `;

    if (current && modules.some(m => String(m.id) === String(current))) {
      select.value = current;
    }
  }

  async function saveQuestion() {
    const id = safeGetValue("questionId");
    const text = safeGetValue("questionText");
    const moduleId = safeGetValue("questionModule");
    const orderRaw = safeGetValue("questionOrder");

    let order = null;

    if (orderRaw !== "") {
      order = Number(orderRaw);
    }

    if (!text) {
      alert("Escribe la pregunta.");
      return;
    }

    if (!moduleId) {
      alert("Selecciona un módulo.");
      return;
    }

    if (order !== null && (!Number.isFinite(order) || order < 1)) {
      alert("Escribe un orden válido. Debe ser mayor o igual a 1.");
      return;
    }

    const payload = {
      texto: text,
      idmodulo: Number(moduleId),
      orden: order
    };

    try {
      let res;

      if (id) {
        res = await fetch(`${API_BASE}/api/preguntas/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/preguntas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.detalle ||
          data.error ||
          "No se pudo guardar la pregunta."
        );
      }

      clearQuestionForm();
      safeSetValue("questionModule", String(moduleId));

      await cargarPreguntasDesdeBD();

      renderQuestions();

      alert(id ? "Pregunta actualizada correctamente." : "Pregunta creada correctamente.");
    } catch (error) {
      console.error("❌ Error guardando pregunta:", error);
      alert(error.message || "No se pudo guardar la pregunta.");
    }
  }

  function editQuestion(id) {
    const config = getConfig();
    const item = config.questions.find((q) => String(q.id) === String(id));

    if (!item) return;

    safeSetValue("questionId", item.id);
    safeSetValue("questionText", item.text);
    safeSetValue("questionModule", item.moduleId);
    safeSetValue("questionOrder", item.order);

    renderQuestions();

    openTab("questions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteQuestion(id) {
    const ok = confirm("¿Seguro que deseas eliminar esta pregunta?");
    if (!ok) return;

    const moduloActual = safeGetValue("questionModule");

    try {
      const res = await fetch(`${API_BASE}/api/preguntas/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar la pregunta.");
      }

      clearQuestionForm();
      safeSetValue("questionModule", moduloActual);

      await cargarPreguntasDesdeBD();
      renderQuestions();

      alert("Pregunta eliminada correctamente.");
    } catch (error) {
      console.error("❌ Error eliminando pregunta:", error);
      alert(error.message || "No se pudo eliminar la pregunta.");
    }
  }

  function clearQuestionForm() {
    const moduloActual = safeGetValue("questionModule");

    safeSetValue("questionId", "");
    safeSetValue("questionText", "");
    safeSetValue("questionOrder", "");

    safeSetValue("questionModule", moduloActual);

    renderQuestions();
  }

  function renderQuestions() {
    const tbody = document.getElementById("questionsTableBody");
    if (!tbody) return;

    const config = getConfig();

    const selectedModuleId = safeGetValue("questionModule");

    let items = Array.isArray(config.questions)
      ? [...config.questions]
      : [];

    if (selectedModuleId) {
      items = items.filter((q) => String(q.moduleId) === String(selectedModuleId));
    }

    items = items.sort((a, b) => {
      const modA = Number(a.moduleId || 0);
      const modB = Number(b.moduleId || 0);

      if (modA !== modB) return modA - modB;

      return Number(a.order || 0) - Number(b.order || 0);
    });

    if (!items.length) {
      if (selectedModuleId) {
        tbody.innerHTML = showEmptyRow(4, "No hay preguntas registradas para este módulo.");
      } else {
        tbody.innerHTML = showEmptyRow(4, "Selecciona un módulo para ver sus preguntas.");
      }

      return;
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${escapeHTML(item.order)}</td>
        <td>${escapeHTML(item.text)}</td>
        <td>${escapeHTML(item.moduleName || "")}</td>
        <td>
          <div class="settings-actions">
            <button type="button" class="btn-settings-warning" data-edit-question="${escapeHTML(item.id)}">
              Editar
            </button>
            <button type="button" class="btn-settings-danger" data-delete-question="${escapeHTML(item.id)}">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll("[data-edit-question]").forEach((btn) => {
      btn.addEventListener("click", () => editQuestion(btn.dataset.editQuestion));
    });

    tbody.querySelectorAll("[data-delete-question]").forEach((btn) => {
      btn.addEventListener("click", () => deleteQuestion(btn.dataset.deleteQuestion));
    });
  }

  // ======================================================
  // USERS / GENTE
  // ======================================================
  async function saveUser() {
    const id = safeGetValue("userId");
    const name = safeGetValue("userName");
    const username = safeGetValue("userUsername");
    const password = safeGetValue("userPassword");
    const email = safeGetValue("userEmail");
    const role = safeGetValue("userRole");

    if (!name) {
      alert("Escribe el nombre del usuario.");
      return;
    }

    if (!username) {
      alert("Escribe el usuario para login.");
      return;
    }

    if (!role) {
      alert("Selecciona un rol.");
      return;
    }

    const payload = {
      nombre: name,
      usuario: username,
      contrasena: password,
      correo: email,
      rol: String(role || "").trim().toLowerCase()
    };

    try {
      let res;

      if (id) {
        res = await fetch(`${API_BASE}/api/usuarios/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        if (!password) {
          alert("Escribe la contraseña.");
          return;
        }

        res = await fetch(`${API_BASE}/api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el usuario.");
      }

      clearUserForm();
      await cargarUsuariosDesdeBD();

      alert(id ? "Usuario actualizado correctamente." : "Usuario creado correctamente.");
    } catch (error) {
      console.error("❌ Error guardando usuario:", error);
      alert(error.message || "No se pudo guardar el usuario.");
    }
  }

  function editUser(id) {
    const config = getConfig();
    const item = config.users.find((u) => String(u.id) === String(id));

    if (!item) return;

    safeSetValue("userId", item.id);
    safeSetValue("userName", item.name);
    safeSetValue("userUsername", item.username);
    safeSetValue("userPassword", item.password || "");
    safeSetValue("userEmail", item.email);
    safeSetValue("userRole", item.role);

    openTab("users");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteUser(id) {
    const ok = confirm("¿Seguro que deseas eliminar este usuario?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/usuarios/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el usuario.");
      }

      await cargarUsuariosDesdeBD();

      alert("Usuario eliminado correctamente.");
    } catch (error) {
      console.error("❌ Error eliminando usuario:", error);
      alert(error.message || "No se pudo eliminar el usuario.");
    }
  }

  function clearUserForm() {
    safeSetValue("userId", "");
    safeSetValue("userName", "");
    safeSetValue("userUsername", "");
    safeSetValue("userPassword", "");
    safeSetValue("userEmail", "");
    safeSetValue("userRole", "");
  }

  function renderUsers() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    const config = getConfig();

    if (!config.users.length) {
      tbody.innerHTML = showEmptyRow(5, "No hay usuarios registrados.");
      return;
    }

    tbody.innerHTML = config.users.map((item) => `
      <tr>
        <td>${escapeHTML(item.name)}</td>
        <td>${escapeHTML(item.username || "")}</td>
        <td>${escapeHTML(item.email || "")}</td>
        <td>${escapeHTML(item.role || "")}</td>
        <td>
          <div class="settings-actions">
            <button type="button" class="btn-settings-warning" data-edit-user="${escapeHTML(item.id)}">
              Editar
            </button>
            <button type="button" class="btn-settings-danger" data-delete-user="${escapeHTML(item.id)}">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll("[data-edit-user]").forEach((btn) => {
      btn.addEventListener("click", () => editUser(btn.dataset.editUser));
    });

    tbody.querySelectorAll("[data-delete-user]").forEach((btn) => {
      btn.addEventListener("click", () => deleteUser(btn.dataset.deleteUser));
    });
  }

  // ======================================================
  // BUSINESS UNITS
  // ======================================================
  async function saveBusinessUnit() {
    const id = safeGetValue("businessUnitId");
    const name = safeGetValue("businessUnitName");

    if (!name) {
      alert("Escribe el nombre de la Business Unit.");
      return;
    }

    const payload = {
      nombre: name
    };

    try {
      let res;

      if (id) {
        res = await fetch(`${API_BASE}/api/business-units/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/business-units`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar la Business Unit.");
      }

      clearBusinessUnitForm();

      await cargarBusinessUnitsDesdeBD();
      await cargarProductionLinesDesdeBD();

      alert(id ? "Business Unit actualizada correctamente." : "Business Unit creada correctamente.");
    } catch (error) {
      console.error("❌ Error guardando Business Unit:", error);
      alert(error.message || "No se pudo guardar la Business Unit.");
    }
  }

  function editBusinessUnit(id) {
    const config = getConfig();
    const item = config.businessUnits.find((b) => String(b.id) === String(id));

    if (!item) return;

    safeSetValue("businessUnitId", item.id);
    safeSetValue("businessUnitName", item.name);

    openTab("businessUnits");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteBusinessUnit(id) {
    const ok = confirm("¿Seguro que deseas eliminar esta Business Unit?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/business-units/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar la Business Unit.");
      }

      clearBusinessUnitForm();

      await cargarBusinessUnitsDesdeBD();
      await cargarProductionLinesDesdeBD();

      alert("Business Unit eliminada correctamente.");
    } catch (error) {
      console.error("❌ Error eliminando Business Unit:", error);
      alert(error.message || "No se pudo eliminar la Business Unit.");
    }
  }

  function clearBusinessUnitForm() {
    safeSetValue("businessUnitId", "");
    safeSetValue("businessUnitName", "");
  }

  function renderBusinessUnits() {
    const tbody = document.getElementById("businessUnitsTableBody");
    if (!tbody) return;

    const config = getConfig();
    const businessUnits = Array.isArray(config.businessUnits) ? config.businessUnits : [];
    const productionLines = Array.isArray(config.productionLines) ? config.productionLines : [];

    if (!businessUnits.length) {
      tbody.innerHTML = showEmptyRow(3, "No hay Business Units registradas.");
      return;
    }

    tbody.innerHTML = businessUnits
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"))
      .map((item) => {
        const countLines = productionLines.filter((pl) => String(pl.businessUnitId) === String(item.id)).length;

        return `
          <tr>
            <td>${escapeHTML(item.name)}</td>
            <td>${countLines}</td>
            <td>
              <div class="settings-actions">
                <button type="button" class="btn-settings-warning" data-edit-bu="${escapeHTML(item.id)}">
                  Editar
                </button>
                <button type="button" class="btn-settings-danger" data-delete-bu="${escapeHTML(item.id)}">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");

    tbody.querySelectorAll("[data-edit-bu]").forEach((btn) => {
      btn.addEventListener("click", () => editBusinessUnit(btn.dataset.editBu));
    });

    tbody.querySelectorAll("[data-delete-bu]").forEach((btn) => {
      btn.addEventListener("click", () => deleteBusinessUnit(btn.dataset.deleteBu));
    });
  }

  // ======================================================
  // PRODUCTION LINES
  // ======================================================
  function fillBusinessUnitSelect() {
    const select = document.getElementById("productionLineBusinessUnit");
    if (!select) return;

    const config = getConfig();
    const businessUnits = Array.isArray(config.businessUnits) ? config.businessUnits : [];

    if (!businessUnits.length) {
      select.innerHTML = `<option value="">No hay Business Units disponibles</option>`;
      return;
    }

    const current = select.value || "";

    select.innerHTML = `
      <option value="">Selecciona Business Unit</option>
      ${businessUnits
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"))
        .map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`)
        .join("")}
    `;

    if (current && businessUnits.some(b => String(b.id) === String(current))) {
      select.value = current;
    }
  }

  async function saveProductionLine() {
    const id = safeGetValue("productionLineId");
    const name = safeGetValue("productionLineName");
    const businessUnitIdRaw = safeGetValue("productionLineBusinessUnit");

    if (!name) {
      alert("Escribe el nombre de la Production Line.");
      return;
    }

    if (!businessUnitIdRaw) {
      alert("Selecciona una Business Unit.");
      return;
    }

    const businessUnitId = Number(businessUnitIdRaw);

    if (!Number.isFinite(businessUnitId) || businessUnitId <= 0) {
      alert("El ID de la Business Unit no es válido.");
      return;
    }

    const payload = {
      nombre: name,
      idbusinessunit: businessUnitId
    };

    try {
      let res;

      if (id) {
        res = await fetch(`${API_BASE}/api/production-lines/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/production-lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.detalle ||
          data.detail ||
          data.error ||
          "No se pudo guardar la Production Line."
        );
      }

      clearProductionLineForm();

      await cargarProductionLinesDesdeBD();
      await cargarBusinessUnitsDesdeBD();

      alert(id ? "Production Line actualizada correctamente." : "Production Line creada correctamente.");
    } catch (error) {
      console.error("❌ Error guardando Production Line:", error);
      alert(error.message || "No se pudo guardar la Production Line.");
    }
  }

  function editProductionLine(id) {
    const config = getConfig();
    const item = config.productionLines.find((pl) => String(pl.id) === String(id));

    if (!item) return;

    safeSetValue("productionLineId", item.id);
    safeSetValue("productionLineName", item.name);
    safeSetValue("productionLineBusinessUnit", item.businessUnitId);

    openTab("productionLines");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProductionLine(id) {
    const ok = confirm("¿Seguro que deseas eliminar esta Production Line?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/production-lines/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar la Production Line.");
      }

      clearProductionLineForm();

      await cargarProductionLinesDesdeBD();
      await cargarBusinessUnitsDesdeBD();

      alert("Production Line eliminada correctamente.");
    } catch (error) {
      console.error("❌ Error eliminando Production Line:", error);
      alert(error.message || "No se pudo eliminar la Production Line.");
    }
  }

  function clearProductionLineForm() {
    safeSetValue("productionLineId", "");
    safeSetValue("productionLineName", "");
    safeSetValue("productionLineBusinessUnit", "");
  }

  function renderProductionLines() {
    const tbody = document.getElementById("productionLinesTableBody");
    if (!tbody) return;

    const config = getConfig();
    const productionLines = Array.isArray(config.productionLines) ? config.productionLines : [];

    if (!productionLines.length) {
      tbody.innerHTML = showEmptyRow(3, "No hay Production Lines registradas.");
      return;
    }

    tbody.innerHTML = productionLines
      .sort((a, b) => {
        const buA = String(a.businessUnitName || "");
        const buB = String(b.businessUnitName || "");

        if (buA !== buB) return buA.localeCompare(buB, "es");

        return String(a.name || "").localeCompare(String(b.name || ""), "es");
      })
      .map((item) => `
        <tr>
          <td>${escapeHTML(item.name)}</td>
          <td>${escapeHTML(item.businessUnitName || "")}</td>
          <td>
            <div class="settings-actions">
              <button type="button" class="btn-settings-warning" data-edit-pl="${escapeHTML(item.id)}">
                Editar
              </button>
              <button type="button" class="btn-settings-danger" data-delete-pl="${escapeHTML(item.id)}">
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      `).join("");

    tbody.querySelectorAll("[data-edit-pl]").forEach((btn) => {
      btn.addEventListener("click", () => editProductionLine(btn.dataset.editPl));
    });

    tbody.querySelectorAll("[data-delete-pl]").forEach((btn) => {
      btn.addEventListener("click", () => deleteProductionLine(btn.dataset.deletePl));
    });
  }

  // ======================================================
  // OPEN TAB
  // ======================================================
  function openTab(tabName) {
    const buttons = document.querySelectorAll(".settings-tab-btn");

    const panels = [
      "tab-questions",
      "tab-users",
      "tab-businessUnits",
      "tab-productionLines"
    ];

    buttons.forEach((b) => b.classList.remove("active"));

    panels.forEach((id) => {
      const panel = document.getElementById(id);

      if (!panel) return;

      panel.classList.add("d-none");
      panel.style.display = "none";
    });

    const activeBtn = document.querySelector(`.settings-tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    const activePanel = document.getElementById(`tab-${tabName}`);

    if (activePanel) {
      activePanel.classList.remove("d-none");
      activePanel.style.display = "block";
    }
  }

  // ======================================================
  // EXPOSURE
  // ======================================================
  window.getAppConfig = getConfig;
})();
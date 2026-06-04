document.addEventListener("DOMContentLoaded", function () {
  // ======================================================
  // CONFIGURACIÓN
  // ======================================================
  const LOGIN_PAGE = "Login.html";

  // Páginas que necesitan login normal
  const PAGES_REQUIRE_LOGIN = [
    "Auditoria.html"
  ];

  // Páginas que necesitan admin
  const PAGES_REQUIRE_ADMIN = [
    "Configuracion.html"
  ];

  // ======================================================
  // ELEMENTOS
  // ======================================================
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserRole = document.getElementById("sidebarUserRole");
  const btnLogout = document.getElementById("btnLogout");
  const menuSettings = document.getElementById("menuSettings");

  // Botón crear plan de acción
  const btnCrearPlanAccion = document.getElementById("btnCrearPlanAccion");

  // Modal de plan de acción
  const modalHallazgo = document.getElementById("modalHallazgo");

  // ======================================================
  // HELPERS
  // ======================================================
  function getCurrentPageName() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1) || "index.html";
  }

  function parseJSONSeguro(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function normalizarUsuario(user) {
    if (!user) return null;

    return {
      id:
        user.id ||
        user.idusuario ||
        user.idUsuario ||
        user.IdUsuario ||
        user.id_usuario ||
        user.usuario_id ||
        "",

      name:
        user.name ||
        user.nombre ||
        user.Nombre ||
        user.nombreusuario ||
        user.NombreUsuario ||
        user.usuario ||
        user.Usuario ||
        user.username ||
        "Usuario",

      username:
        user.username ||
        user.usuario ||
        user.Usuario ||
        user.user ||
        user.email ||
        "",

      role:
        user.role ||
        user.rol ||
        user.Rol ||
        user.tipo ||
        user.perfil ||
        user.Perfil ||
        "USUARIO"
    };
  }

  function getCurrentUser() {
    const rawCurrentUser = localStorage.getItem("currentUser");
    const rawUser = localStorage.getItem("user");

    let parsed = null;

    if (rawCurrentUser) {
      parsed = parseJSONSeguro(rawCurrentUser);
    }

    if (!parsed && rawUser) {
      parsed = parseJSONSeguro(rawUser);
    }

    if (!parsed) return null;

    const user = normalizarUsuario(parsed);

    if (!user) return null;

    // Asegura formato estándar
    localStorage.setItem("currentUser", JSON.stringify(user));

    return user;
  }

  function isLoggedIn() {
    const user = getCurrentUser();
    return Boolean(user);
  }

  function isAdmin() {
    const user = getCurrentUser();

    if (!user) return false;

    const role = String(
      user.role ||
      user.rol ||
      user.tipo ||
      user.perfil ||
      ""
    ).trim().toUpperCase();

    return (
      role === "ADMIN" ||
      role === "ADMINISTRADOR" ||
      role === "ADMINISTRATOR"
    );
  }

  function redirectToLogin() {
    const currentUrl = window.location.href;
    window.location.href = `${LOGIN_PAGE}?redirect=${encodeURIComponent(currentUrl)}`;
  }

  function redirectToHome() {
    window.location.href = "index.html";
  }

  // ======================================================
  // VALIDAR ACCESO POR PÁGINA
  // ======================================================
  function validarAccesoPagina() {
    const currentPage = getCurrentPageName();

    const requiereLogin = PAGES_REQUIRE_LOGIN.includes(currentPage);
    const requiereAdmin = PAGES_REQUIRE_ADMIN.includes(currentPage);

    // Nueva Auditoría: necesita login
    if (requiereLogin && !isLoggedIn()) {
      redirectToLogin();
      return;
    }

    // Configuración: necesita login y admin
    if (requiereAdmin) {
      if (!isLoggedIn()) {
        redirectToLogin();
        return;
      }

      if (!isAdmin()) {
        alert("No tienes permisos para entrar a Configuración.");
        redirectToHome();
        return;
      }
    }
  }

  // ======================================================
  // VALIDAR CREAR PLAN DE ACCIÓN
  // ======================================================
  function protegerCrearPlanAccion() {
    if (!btnCrearPlanAccion) return;

    btnCrearPlanAccion.addEventListener(
      "click",
      function (e) {
        if (!isLoggedIn()) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          alert("Para crear un Plan de Acción necesitas iniciar sesión.");
          redirectToLogin();

          return false;
        }

        return true;
      },
      true
    );
  }

  // ======================================================
  // VALIDAR MODAL PLAN DE ACCIÓN
  // Esta función era la que faltaba.
  // Evita que se abra el modal si no hay sesión.
  // ======================================================
  function protegerModalPlanAccion() {
    if (!modalHallazgo) return;

    modalHallazgo.addEventListener("show.bs.modal", function (e) {
      if (!isLoggedIn()) {
        e.preventDefault();

        alert("Para crear o editar un Plan de Acción necesitas iniciar sesión.");
        redirectToLogin();

        return false;
      }

      return true;
    });
  }

  // ======================================================
  // MOSTRAR / OCULTAR MENÚS
  // ======================================================
  function configurarSidebarUsuario() {
    const user = getCurrentUser();

    if (user) {
      const nombre =
        user.name ||
        user.nombre ||
        user.username ||
        user.usuario ||
        "Usuario";

      const role =
        user.role ||
        user.rol ||
        "Usuario";

      if (sidebarUserName) {
        sidebarUserName.textContent = nombre;
      }

      if (sidebarUserRole) {
        sidebarUserRole.textContent = role;
      }

      if (btnLogout) {
        btnLogout.style.display = "flex";
      }
    } else {
      if (sidebarUserName) {
        sidebarUserName.textContent = "Invitado";
      }

      if (sidebarUserRole) {
        sidebarUserRole.textContent = "Sin sesión";
      }

      if (btnLogout) {
        btnLogout.style.display = "none";
      }
    }

    // Configuración solo visible para admin
    if (menuSettings) {
      menuSettings.style.display = isAdmin() ? "flex" : "none";
    }
  }

  // ======================================================
  // LOGOUT
  // ======================================================
  if (btnLogout) {
    btnLogout.addEventListener("click", function (e) {
      e.preventDefault();

      const confirmar = confirm("¿Seguro que quieres cerrar sesión?");

      if (!confirmar) {
        return;
      }

      localStorage.removeItem("currentUser");
      localStorage.removeItem("user");
      localStorage.removeItem("usuario");
      localStorage.removeItem("usuarioActual");
      localStorage.removeItem("usuarioLogueado");
      localStorage.removeItem("loggedUser");
      localStorage.removeItem("loginUser");
      localStorage.removeItem("sessionUser");

      window.location.href = "index.html";
    });
  }

  // ======================================================
  // INICIO
  // ======================================================
  validarAccesoPagina();
  configurarSidebarUsuario();
  protegerCrearPlanAccion();
  protegerModalPlanAccion();
});
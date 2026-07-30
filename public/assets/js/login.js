const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const feedback = document.getElementById("feedback");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const FALLBACK_API_ORIGIN = "http://localhost:9000";

function sanitizeReturnTo(value) {
  const path = String(value || "").trim();

  if (!path || !path.startsWith("/")) {
    return null;
  }

  if (path.startsWith("//")) {
    return null;
  }

  if (/^\/public\/pages\/login\.html(?:$|[?#])/i.test(path)) {
    return null;
  }

  return path;
}

function getRequestedReturnTo() {
  const searchParams = new URLSearchParams(window.location.search);
  return sanitizeReturnTo(searchParams.get("returnTo"));
}

function getDefaultRedirectForUser(user) {
  if (user?.role === "admin") {
    return "/public/pages/admin.html";
  }

  return "/public/pages/profile.html";
}

function getPostAuthRedirect(user) {
  return getRequestedReturnTo() || getDefaultRedirectForUser(user);
}

const existingAuthRaw = localStorage.getItem("bettyAuth");
let existingAuth = null;

if (existingAuthRaw) {
  try {
    existingAuth = JSON.parse(existingAuthRaw);
  } catch (error) {
    localStorage.removeItem("bettyAuth");
  }
}

if (existingAuth && existingAuth.token && existingAuth.user) {
  window.location.href = getPostAuthRedirect(existingAuth.user);
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

async function readResponsePayload(response) {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    return null;
  }
}

function buildApiUrl(pathname) {
  const { origin, protocol } = window.location;

  if (!origin || origin === "null" || protocol === "file:") {
    return `${FALLBACK_API_ORIGIN}${pathname}`;
  }

  return pathname;
}

async function postAuth(pathname, body) {
  const requestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  };

  const primaryResponse = await fetch(buildApiUrl(pathname), requestInit);

  if (
    primaryResponse.status === 404 &&
    window.location.origin &&
    window.location.origin !== "null" &&
    window.location.origin !== FALLBACK_API_ORIGIN
  ) {
    return fetch(`${FALLBACK_API_ORIGIN}${pathname}`, requestInit);
  }

  return primaryResponse;
}

function activateTab(tabName) {
  const showLogin = tabName === "login";

  loginForm.classList.toggle("hidden", !showLogin);
  registerForm.classList.toggle("hidden", showLogin);

  tabLogin.classList.toggle("active", showLogin);
  tabRegister.classList.toggle("active", !showLogin);

  tabLogin.setAttribute("aria-selected", showLogin ? "true" : "false");
  tabRegister.setAttribute("aria-selected", showLogin ? "false" : "true");

  setFeedback("", "");
}

tabLogin.addEventListener("click", () => activateTab("login"));
tabRegister.addEventListener("click", () => activateTab("register"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const identifier = formData.get("identifier");
  const password = formData.get("password");

  setFeedback("Validando credenciales...", "success");

  try {
    const response = await postAuth("/api/auth/login", {
      identifier,
      password,
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      const fallbackMessage =
        response.status === 404
          ? "No se encontro el endpoint de autenticacion. Abre la app desde http://localhost:9000/public/pages/login.html"
          : response.status === 429
            ? "Demasiados intentos. Intenta de nuevo en unos minutos."
            : `No se pudo iniciar sesion (HTTP ${response.status}).`;
      throw new Error(payload?.error || fallbackMessage);
    }

    if (!payload || !payload.token || !payload.user) {
      throw new Error("Respuesta invalida del servidor al iniciar sesion.");
    }

    localStorage.setItem(
      "bettyAuth",
      JSON.stringify({ token: payload.token, user: payload.user }),
    );

    setFeedback("Sesion iniciada. Redirigiendo...", "success");

    window.location.href = getPostAuthRedirect(payload.user);
  } catch (error) {
    if (error instanceof TypeError) {
      setFeedback(
        "No se pudo conectar con el servidor. Verifica que el backend este corriendo en http://localhost:9000",
        "error",
      );
      return;
    }

    setFeedback(error.message, "error");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const email = formData.get("email");
  const password = formData.get("password");
  const displayName = formData.get("displayName");

  setFeedback("Creando cuenta...", "success");

  try {
    const response = await postAuth("/api/auth/register", {
      email,
      password,
      displayName,
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      const fallbackMessage =
        response.status === 404
          ? "No se encontro el endpoint de registro. Abre la app desde http://localhost:9000/public/pages/login.html"
          : `No se pudo crear la cuenta (HTTP ${response.status}).`;
      throw new Error(payload?.error || fallbackMessage);
    }

    if (!payload || !payload.token || !payload.user) {
      throw new Error("Respuesta invalida del servidor al crear la cuenta.");
    }

    localStorage.setItem(
      "bettyAuth",
      JSON.stringify({ token: payload.token, user: payload.user }),
    );

    setFeedback("Cuenta creada. Redirigiendo...", "success");
    window.location.href = getPostAuthRedirect(payload.user);
  } catch (error) {
    if (error instanceof TypeError) {
      setFeedback(
        "No se pudo conectar con el servidor. Verifica que el backend este corriendo en http://localhost:9000",
        "error",
      );
      return;
    }

    setFeedback(error.message, "error");
  }
});

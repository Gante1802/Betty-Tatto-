const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const feedback = document.getElementById("feedback");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");

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
  if (existingAuth.user.role === "admin") {
    window.location.href = "/public/pages/admin.html";
  } else {
    window.location.href = "/public/pages/profile.html";
  }
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
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
  const username = formData.get("username");
  const password = formData.get("password");

  setFeedback("Validando credenciales...", "success");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo iniciar sesion.");
    }

    localStorage.setItem(
      "bettyAuth",
      JSON.stringify({ token: payload.token, user: payload.user }),
    );

    setFeedback("Sesion iniciada. Redirigiendo...", "success");

    if (payload.user.role === "admin") {
      window.location.href = "/public/pages/admin.html";
      return;
    }

    window.location.href = "/public/pages/profile.html";
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const username = formData.get("username");
  const password = formData.get("password");
  const displayName = formData.get("displayName");

  setFeedback("Creando cuenta...", "success");

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName }),
      credentials: "include",
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo crear la cuenta.");
    }

    localStorage.setItem(
      "bettyAuth",
      JSON.stringify({ token: payload.token, user: payload.user }),
    );

    setFeedback("Cuenta creada. Redirigiendo...", "success");
    window.location.href = "/public/pages/profile.html";
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

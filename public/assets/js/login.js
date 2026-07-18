const loginForm = document.getElementById("login-form");
const feedback = document.getElementById("feedback");

const existingAuthRaw = localStorage.getItem("bettyAuth");
const existingAuth = existingAuthRaw ? JSON.parse(existingAuthRaw) : null;

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

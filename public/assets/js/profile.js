const authRaw = localStorage.getItem("bettyAuth");
let auth = null;

if (authRaw) {
  try {
    auth = JSON.parse(authRaw);
  } catch (error) {
    localStorage.removeItem("bettyAuth");
  }
}

if (!auth || !auth.token || !auth.user) {
  window.location.href = "/public/pages/login.html";
}

document.getElementById("welcome").textContent =
  `Hola ${auth.user.displayName || auth.user.username}`;
document.getElementById("user-role").textContent = `Rol: ${auth.user.role}`;
document.getElementById("user-name").textContent =
  `Usuario: ${auth.user.username}`;

document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    // Ignore logout API errors and continue local cleanup.
  }

  localStorage.removeItem("bettyAuth");
  document.cookie =
    "bettyAuthToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  window.location.href = "/public/pages/login.html";
});

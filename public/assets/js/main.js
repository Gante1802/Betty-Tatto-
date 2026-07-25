(function initMainNavigation() {
  const profileLink = document.getElementById("profile-link");
  const yearNode = document.getElementById("year");

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  if (!profileLink) {
    return;
  }

  let auth = null;
  const authRaw = localStorage.getItem("bettyAuth");

  if (authRaw) {
    try {
      auth = JSON.parse(authRaw);
    } catch (error) {
      localStorage.removeItem("bettyAuth");
    }
  }

  const role = String(auth?.user?.role || "").toLowerCase();
  const hasToken = Boolean(auth?.token);

  if (!hasToken) {
    profileLink.href = "/public/pages/login.html";
    profileLink.textContent = "Perfil";
    return;
  }

  if (role === "admin") {
    profileLink.href = "/public/pages/admin.html";
    profileLink.textContent = "Perfil admin";
    return;
  }

  profileLink.href = "/public/pages/profile.html";
  profileLink.textContent = "Mi perfil";
})();

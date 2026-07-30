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

function formatOptional(value) {
  const normalized = String(value || "").trim();
  return normalized || "-";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatBookingStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  if (normalized === "pending") {
    return "Pendiente";
  }

  if (normalized === "approved") {
    return "Aprobada";
  }

  if (normalized === "rejected") {
    return "Rechazada";
  }

  if (normalized === "contacted") {
    return "Contactada";
  }

  return formatOptional(status);
}

function formatBookingType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();

  if (normalized === "flash") {
    return "Flash";
  }

  if (normalized === "custom") {
    return "Personalizado";
  }

  return formatOptional(type);
}

function renderCurrentBooking(booking) {
  const noBooking = document.getElementById("no-booking");
  const currentBooking = document.getElementById("current-booking");

  if (!booking) {
    currentBooking.classList.add("hidden");
    noBooking.classList.remove("hidden");
    document.getElementById("status-intro").textContent =
      "Aun no hay una solicitud activa para mostrar.";
    return;
  }

  const statusClass = String(booking.status || "")
    .trim()
    .toLowerCase();

  document.getElementById("status-intro").textContent =
    "Este es el estado mas reciente de tu cita.";
  document.getElementById("booking-title").textContent =
    `${formatBookingType(booking.type)} - ${formatOptional(booking.name)}`;

  const statusNode = document.getElementById("booking-status");
  statusNode.textContent = formatBookingStatus(booking.status);
  statusNode.className = `status-badge ${statusClass}`.trim();

  document.getElementById("booking-date").textContent =
    `Fecha y hora: ${formatOptional(booking.appointmentDate)} ${formatOptional(booking.appointmentTime)}`;
  document.getElementById("booking-type").textContent =
    `Tipo: ${formatBookingType(booking.type)}`;
  document.getElementById("booking-contact").textContent =
    `Contacto: ${formatOptional(booking.contactMethod)} | Email: ${formatOptional(booking.email)} | WhatsApp: ${formatOptional(booking.whatsapp)}`;
  document.getElementById("booking-admin-comment").textContent =
    `Comentario de Betty: ${formatOptional(booking.adminComment)}`;
  document.getElementById("booking-admin-price").textContent =
    `Precio sugerido: ${formatOptional(booking.adminQuotedPrice)}`;
  document.getElementById("booking-updated-at").textContent =
    `Ultima actualizacion: ${formatDateTime(booking.updatedAt)}`;

  noBooking.classList.add("hidden");
  currentBooking.classList.remove("hidden");
}

async function loadBookingStatus() {
  try {
    const response = await fetch("/api/bookings/me", {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      credentials: "include",
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo cargar tu solicitud.");
    }

    const bookings = Array.isArray(payload.data) ? payload.data : [];
    renderCurrentBooking(bookings[0] || null);
  } catch (error) {
    document.getElementById("status-intro").textContent = error.message;
    document.getElementById("no-booking").classList.remove("hidden");
  }
}

loadBookingStatus();

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

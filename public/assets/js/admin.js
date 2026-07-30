const authRaw = localStorage.getItem("bettyAuth");
let auth = null;

if (authRaw) {
  try {
    auth = JSON.parse(authRaw);
  } catch (error) {
    localStorage.removeItem("bettyAuth");
  }
}

if (!auth || !auth.token || !auth.user || auth.user.role !== "admin") {
  window.location.href = "/public/pages/login.html";
}

const flashForm = document.getElementById("flash-form");
const feedback = document.getElementById("feedback");
const flashList = document.getElementById("flash-list");
const bookingList = document.getElementById("booking-list");
const bookingFeedback = document.getElementById("booking-feedback");
const bookingStatusFilter = document.getElementById("booking-status-filter");
const bookingRefreshButton = document.getElementById("booking-refresh-btn");
const logoutButton = document.getElementById("logout-btn");
const cancelEditButton = document.getElementById("cancel-edit-btn");
const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-btn");
const adminCalendarGrid = document.getElementById("admin-calendar-grid");
const adminCalendarLabel = document.getElementById("admin-calendar-label");
const adminCalendarPrev = document.getElementById("admin-calendar-prev");
const adminCalendarNext = document.getElementById("admin-calendar-next");

const slotEditor = document.getElementById("slot-editor");
const slotEditorDate = document.getElementById("slot-editor-date");
const slotSummary = document.getElementById("slot-summary");
const slotForm = document.getElementById("slot-form");
const slotList = document.getElementById("slot-list");
const slotResetButton = document.getElementById("slot-reset-btn");
const slotDisableDateButton = document.getElementById("slot-disable-date-btn");

let editingFlashId = null;
let availabilityMap = new Map();
let calendarMonthDate = new Date();
let selectedAvailabilityDate = null;
calendarMonthDate.setDate(1);

// Horarios por defecto para cada dia disponible.
// Cambia esta lista si quieres nuevos horarios.
const DEFAULT_DAILY_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

function setBookingFeedback(message, type) {
  bookingFeedback.textContent = message;
  bookingFeedback.className = `feedback ${type}`;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.token}`,
  };
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateKey() {
  return getDateKey(new Date());
}

function formatDateLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizeSlots(slots) {
  const values = Array.isArray(slots) ? slots : [];
  const unique = [
    ...new Set(values.map((slot) => String(slot || "").trim())),
  ].filter(Boolean);
  unique.sort();
  return unique;
}

function slotsForDisplay(slots) {
  const normalized = normalizeSlots(slots);
  return normalized.length ? normalized : [...DEFAULT_DAILY_SLOTS];
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || "").trim());
}

function getSlotsForDate(date) {
  if (!date || !availabilityMap.has(date)) {
    return [];
  }

  return slotsForDisplay(availabilityMap.get(date).slots);
}

function renderHoursInfo() {
  const baseSlots = slotsForDisplay([]);

  if (slotEditor) {
    slotEditor.classList.remove("hidden");
  }

  if (slotEditorDate) {
    slotEditorDate.textContent = selectedAvailabilityDate
      ? formatDateLabel(selectedAvailabilityDate)
      : "cada dia disponible";
  }

  if (slotSummary) {
    if (selectedAvailabilityDate) {
      const daySlots = getSlotsForDate(selectedAvailabilityDate);
      slotSummary.textContent = `Gestionando ${daySlots.length} horarios para ${formatDateLabel(selectedAvailabilityDate)}.`;
    } else {
      slotSummary.textContent = `Horario base activo (${baseSlots.length} turnos): estos horarios se usan en todos los dias habilitados.`;
    }
  }

  if (slotForm) {
    slotForm.classList.toggle("hidden", !selectedAvailabilityDate);
  }

  if (slotResetButton) {
    slotResetButton.disabled = !selectedAvailabilityDate;
  }

  if (slotDisableDateButton) {
    slotDisableDateButton.disabled = !selectedAvailabilityDate;
  }

  const slotsToRender = selectedAvailabilityDate
    ? getSlotsForDate(selectedAvailabilityDate)
    : baseSlots;

  slotList.innerHTML = slotsToRender
    .map((slot) => {
      const removeButton = selectedAvailabilityDate
        ? `<button class="slot-remove-btn" type="button" data-slot="${slot}">Quitar</button>`
        : "";

      return `<article class="slot-item"><span>${slot}</span>${removeButton}</article>`;
    })
    .join("");
}

async function persistSlotsForDate(date, slots) {
  const response = await fetch(`/api/availability/${date}/slots`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ slots }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron guardar los horarios.");
  }
}

function selectAvailabilityDate(date) {
  if (!availabilityMap.has(date)) {
    selectedAvailabilityDate = null;
    renderHoursInfo();
    return;
  }

  selectedAvailabilityDate = date;
  renderHoursInfo();
}

function resetFormState() {
  editingFlashId = null;
  flashForm.reset();
  formTitle.textContent = "Crear nuevo flash";
  submitButton.textContent = "Guardar flash";
  cancelEditButton.hidden = true;
}

function fillForm(flash) {
  editingFlashId = flash.id;
  flashForm.elements.title.value = flash.title;
  flashForm.elements.image.value = flash.image;
  flashForm.elements.price.value = flash.price;
  flashForm.elements.description.value = flash.description;
  formTitle.textContent = "Editar flash";
  submitButton.textContent = "Actualizar flash";
  cancelEditButton.hidden = false;
}

async function fetchFlashes() {
  const response = await fetch("/api/flashes");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar los flashes.");
  }

  return payload.data || [];
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

function formatOptional(value) {
  const normalized = String(value || "").trim();
  return normalized || "-";
}

function formatBookingType(value) {
  if (value === "flash") {
    return "Flash";
  }

  if (value === "custom") {
    return "Personalizado";
  }

  return formatOptional(value);
}

function formatBookingStatus(value) {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (status === "pending") {
    return "Pendiente";
  }

  if (status === "approved") {
    return "Aprobada";
  }

  if (status === "rejected") {
    return "Rechazada";
  }

  if (status === "contacted") {
    return "Contactada";
  }

  return formatOptional(value);
}

function getSelectedBookingStatusFilter() {
  return String(bookingStatusFilter?.value || "").trim();
}

async function fetchBookings() {
  const statusFilter = getSelectedBookingStatusFilter();
  const query = statusFilter
    ? `?status=${encodeURIComponent(statusFilter)}`
    : "";

  const response = await fetch(`/api/bookings${query}`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar las solicitudes.");
  }

  return Array.isArray(payload.data) ? payload.data : [];
}

function renderBookings(bookings) {
  if (!bookings.length) {
    bookingList.innerHTML =
      '<p class="booking-empty">No hay solicitudes registradas por ahora.</p>';
    return;
  }

  bookingList.innerHTML = bookings
    .map((booking) => {
      const statusClass = String(booking.status || "")
        .trim()
        .toLowerCase();
      const referenceLink = booking.referenceImageUrl
        ? `<a href="${booking.referenceImageUrl}" target="_blank" rel="noopener">Ver referencia</a>`
        : "-";

      return `
        <article class="booking-item">
          <header>
            <h3>${booking.name}</h3>
            <span class="booking-status ${statusClass}">${formatBookingStatus(booking.status)}</span>
          </header>
          <p class="booking-meta">Creada: ${formatDateTime(booking.createdAt)}</p>
          <div class="booking-grid">
            <p><strong>Tipo:</strong> ${formatBookingType(booking.type)}</p>
            <p><strong>Fecha:</strong> ${formatOptional(booking.appointmentDate)} ${formatOptional(booking.appointmentTime)}</p>
            <p><strong>Cliente:</strong> ${formatOptional(booking.userDisplayName)} (${formatOptional(booking.username)})</p>
            <p><strong>Contacto:</strong> ${formatOptional(booking.contactMethod)}</p>
            <p><strong>Email:</strong> ${formatOptional(booking.email)}</p>
            <p><strong>WhatsApp:</strong> ${formatOptional(booking.whatsapp)}</p>
            <p><strong>Flash:</strong> ${formatOptional(booking.flashDesign)}</p>
            <p><strong>Zona:</strong> ${formatOptional(booking.placement)}</p>
            <p><strong>Tamano:</strong> ${formatOptional(booking.size)}</p>
            <p><strong>Color:</strong> ${formatOptional(booking.color)}</p>
            <p><strong>Estilo:</strong> ${formatOptional(booking.style)}</p>
            <p><strong>Referencia:</strong> ${referenceLink}</p>
          </div>
          <p><strong>Idea:</strong> ${formatOptional(booking.idea)}</p>
          <p><strong>Respuesta admin:</strong> ${formatOptional(booking.adminComment)}</p>
          <p><strong>Precio sugerido:</strong> ${formatOptional(booking.adminQuotedPrice)}</p>
          <p><strong>Respondido:</strong> ${formatDateTime(booking.adminRespondedAt)}</p>

          <form class="booking-response-form" data-booking-id="${booking.id}">
            <label>
              Comentario para cliente
              <textarea name="adminComment" placeholder="Ej: Te propongo este diseno por ..."></textarea>
            </label>
            <div class="booking-response-grid">
              <label>
                Precio (opcional)
                <input name="adminQuotedPrice" type="text" placeholder="Ej: 120 USD" />
              </label>
            </div>
            <div class="booking-actions">
              <button class="primary" type="submit" data-next-status="approved">Aceptar</button>
              <button class="danger" type="submit" data-next-status="rejected">Negar</button>
            </div>
          </form>
        </article>
      `;
    })
    .join("");
}

async function refreshBookings() {
  try {
    const bookings = await fetchBookings();
    renderBookings(bookings);
  } catch (error) {
    setBookingFeedback(error.message, "error");
  }
}

function renderFlashes(flashes) {
  flashList.innerHTML = flashes
    .map(
      (flash) => `
        <article class="flash-item">
          <img src="${flash.image}" alt="${flash.title}" />
          <h3>${flash.title}</h3>
          <p>${flash.description}</p>
          <strong>${flash.price}</strong>
          <div class="flash-actions">
            <button class="secondary" data-action="edit" data-id="${flash.id}">Editar</button>
            <button class="danger" data-action="delete" data-id="${flash.id}">Eliminar</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderAvailabilityCalendar() {
  const year = calendarMonthDate.getFullYear();
  const monthIndex = calendarMonthDate.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const today = getTodayDateKey();

  adminCalendarLabel.textContent = firstDay.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const cells = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push('<span class="calendar-cell empty"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const dateKey = getDateKey(date);
    const isAvailable = availabilityMap.has(dateKey);
    const isToday = dateKey === today;
    const isPast = dateKey < today;

    cells.push(`
      <button
        type="button"
        class="calendar-cell day ${isAvailable ? "available" : ""} ${isToday ? "today" : ""}"
        data-date="${dateKey}"
        ${isPast ? "disabled" : ""}
      >
        ${day}
      </button>
    `);
  }

  adminCalendarGrid.innerHTML = cells.join("");
}

async function fetchAvailability() {
  const response = await fetch("/api/availability");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo cargar la disponibilidad.");
  }

  return payload.data || [];
}

function renderAvailability(dates) {
  availabilityMap = new Map(
    dates.map((item) => [item.date, { slots: slotsForDisplay(item.slots) }]),
  );

  if (
    selectedAvailabilityDate &&
    !availabilityMap.has(selectedAvailabilityDate)
  ) {
    selectedAvailabilityDate = null;
  }

  renderAvailabilityCalendar();
  renderHoursInfo();
}

async function refreshAvailability() {
  try {
    const dates = await fetchAvailability();
    renderAvailability(dates);
  } catch (error) {
    setFeedback(error.message, "error");
  }
}

async function refreshFlashes() {
  try {
    const flashes = await fetchFlashes();
    renderFlashes(flashes);
  } catch (error) {
    setFeedback(error.message, "error");
  }
}

flashForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(flashForm);
  const body = {
    title: String(formData.get("title") || "").trim(),
    image: String(formData.get("image") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price: String(formData.get("price") || "").trim(),
  };

  const endpoint = editingFlashId
    ? `/api/flashes/${editingFlashId}`
    : "/api/flashes";
  const method = editingFlashId ? "PUT" : "POST";

  try {
    const response = await fetch(endpoint, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo guardar el flash.");
    }

    setFeedback(
      editingFlashId
        ? "Flash actualizado correctamente."
        : "Flash creado correctamente.",
      "success",
    );

    resetFormState();
    await refreshFlashes();
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

cancelEditButton.addEventListener("click", () => {
  resetFormState();
  setFeedback("Edicion cancelada.", "success");
});

flashList.addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  const flashId = event.target.dataset.id;

  if (!action || !flashId) {
    return;
  }

  if (action === "edit") {
    try {
      const flashes = await fetchFlashes();
      const flash = flashes.find((item) => item.id === flashId);

      if (!flash) {
        throw new Error("No se encontro el flash seleccionado.");
      }

      fillForm(flash);
      setFeedback("Editando flash seleccionado.", "success");
    } catch (error) {
      setFeedback(error.message, "error");
    }

    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm("Quieres eliminar este flash?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/flashes/${flashId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo eliminar.");
      }

      setFeedback("Flash eliminado correctamente.", "success");
      await refreshFlashes();

      if (editingFlashId === flashId) {
        resetFormState();
      }
    } catch (error) {
      setFeedback(error.message, "error");
    }
  }
});

bookingList.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitter = event.submitter;
  const status = submitter?.dataset?.nextStatus;
  const formElement = event.target;
  const bookingId = formElement?.dataset?.bookingId;

  if (!bookingId || !status) {
    return;
  }

  const formData = new FormData(formElement);
  const body = {
    status,
    adminComment: String(formData.get("adminComment") || "").trim(),
    adminQuotedPrice: String(formData.get("adminQuotedPrice") || "").trim(),
  };

  try {
    const response = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.error || "No se pudo actualizar el estado de la solicitud.",
      );
    }

    const notificationSummary = payload?.notification?.sent
      ? " Notificacion enviada al cliente."
      : " Estado actualizado sin notificacion automatica.";

    setBookingFeedback(
      `Solicitud actualizada correctamente.${notificationSummary}`,
      "success",
    );
    await refreshBookings();
  } catch (error) {
    setBookingFeedback(error.message, "error");
  }
});

if (bookingStatusFilter) {
  bookingStatusFilter.addEventListener("change", () => {
    refreshBookings();
  });
}

if (bookingRefreshButton) {
  bookingRefreshButton.addEventListener("click", () => {
    refreshBookings();
  });
}

adminCalendarPrev.addEventListener("click", () => {
  calendarMonthDate = new Date(
    calendarMonthDate.getFullYear(),
    calendarMonthDate.getMonth() - 1,
    1,
  );
  renderAvailabilityCalendar();
});

adminCalendarNext.addEventListener("click", () => {
  calendarMonthDate = new Date(
    calendarMonthDate.getFullYear(),
    calendarMonthDate.getMonth() + 1,
    1,
  );
  renderAvailabilityCalendar();
});

adminCalendarGrid.addEventListener("click", async (event) => {
  const date = event.target.dataset.date;

  if (!date) {
    return;
  }

  const exists = availabilityMap.has(date);

  try {
    if (!exists) {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ date }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo activar la fecha.");
      }

      setFeedback(`Fecha ${formatDateLabel(date)} activada.`, "success");
      await refreshAvailability();
      selectAvailabilityDate(date);
      return;
    }

    selectAvailabilityDate(date);
    setFeedback(`Editando horarios de ${formatDateLabel(date)}.`, "success");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

slotForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedAvailabilityDate) {
    setFeedback("Primero selecciona un dia disponible.", "error");
    return;
  }

  const timeValue = String(slotForm.elements.time.value || "").trim();

  if (!isValidTime(timeValue)) {
    setFeedback("Usa una hora valida en formato HH:mm.", "error");
    return;
  }

  const currentSlots = getSlotsForDate(selectedAvailabilityDate);

  if (currentSlots.includes(timeValue)) {
    setFeedback("Esa hora ya existe en el dia seleccionado.", "error");
    return;
  }

  const nextSlots = [...currentSlots, timeValue].sort();

  try {
    await persistSlotsForDate(selectedAvailabilityDate, nextSlots);
    setFeedback("Horario agregado correctamente.", "success");
    slotForm.reset();
    await refreshAvailability();
    selectAvailabilityDate(selectedAvailabilityDate);
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

slotList.addEventListener("click", async (event) => {
  const slotToRemove = event.target.dataset.slot;

  if (!selectedAvailabilityDate || !slotToRemove) {
    return;
  }

  const currentSlots = getSlotsForDate(selectedAvailabilityDate);

  if (currentSlots.length <= 1) {
    setFeedback(
      "Debe quedar al menos 1 horario. Puedes desactivar el dia si no atenderas.",
      "error",
    );
    return;
  }

  const nextSlots = currentSlots.filter((slot) => slot !== slotToRemove);

  try {
    await persistSlotsForDate(selectedAvailabilityDate, nextSlots);
    setFeedback("Horario eliminado correctamente.", "success");
    await refreshAvailability();
    selectAvailabilityDate(selectedAvailabilityDate);
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

slotResetButton.addEventListener("click", async () => {
  if (!selectedAvailabilityDate) {
    setFeedback("Primero selecciona un dia disponible.", "error");
    return;
  }

  try {
    await persistSlotsForDate(selectedAvailabilityDate, [
      ...DEFAULT_DAILY_SLOTS,
    ]);
    setFeedback(
      "Horarios base restaurados para el dia seleccionado.",
      "success",
    );
    await refreshAvailability();
    selectAvailabilityDate(selectedAvailabilityDate);
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

slotDisableDateButton.addEventListener("click", async () => {
  if (!selectedAvailabilityDate) {
    setFeedback("Primero selecciona un dia disponible.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Quieres desactivar ${formatDateLabel(selectedAvailabilityDate)}?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `/api/availability/${selectedAvailabilityDate}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo desactivar la fecha.");
    }

    setFeedback(
      `Fecha ${formatDateLabel(selectedAvailabilityDate)} desactivada.`,
      "success",
    );
    selectedAvailabilityDate = null;
    await refreshAvailability();
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

logoutButton.addEventListener("click", async () => {
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

resetFormState();
renderHoursInfo();
refreshFlashes();
refreshAvailability();
refreshBookings();

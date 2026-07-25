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
const slotForm = document.getElementById("slot-form");
const slotList = document.getElementById("slot-list");

let editingFlashId = null;
let availabilityMap = new Map();
let calendarMonthDate = new Date();
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

function renderHoursInfo() {
  if (slotForm) {
    slotForm.classList.add("hidden");
  }

  if (slotEditor) {
    slotEditor.classList.remove("hidden");
  }

  if (slotEditorDate) {
    slotEditorDate.textContent = "cada dia disponible";
  }

  slotList.innerHTML = slotsForDisplay([])
    .map((slot) => `<article class="slot-item"><span>${slot}</span></article>`)
    .join("");
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
  renderAvailabilityCalendar();
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
      return;
    }

    const confirmed = window.confirm(
      `Quieres desactivar ${formatDateLabel(date)}?`,
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/availability/${date}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo desactivar la fecha.");
    }

    setFeedback(`Fecha ${formatDateLabel(date)} desactivada.`, "success");
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

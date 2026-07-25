const form = document.getElementById("booking-form");
const type = document.getElementById("type");
const flashFields = document.getElementById("flashFields");
const customFields = document.getElementById("customFields");
const flashOptionsContainer = document.getElementById("flash-options");
const flashSelectionDetails = document.getElementById(
  "flash-selection-details",
);
const flashSelectionTitle = document.getElementById("flash-selection-title");
const flashSelectionDescription = document.getElementById(
  "flash-selection-description",
);
const flashSelectionPrice = document.getElementById("flash-selection-price");
const contactMethodInputs = document.querySelectorAll(
  'input[name="contactMethod"]',
);
const emailField = document.getElementById("emailField");
const whatsappField = document.getElementById("whatsappField");
const emailInput = emailField.querySelector('input[name="email"]');
const whatsappInput = whatsappField.querySelector('input[name="whatsapp"]');
const referencesInput = form.querySelector('input[name="references"]');

const appointmentDateInput = document.getElementById("appointmentDate");
const appointmentTimeInput = document.getElementById("appointmentTime");
const availabilityHelp = document.getElementById("availability-help");

const bookingCalendarGrid = document.getElementById("booking-calendar-grid");
const bookingCalendarLabel = document.getElementById("booking-calendar-label");
const bookingCalendarPrev = document.getElementById("booking-calendar-prev");
const bookingCalendarNext = document.getElementById("booking-calendar-next");

let availabilityMap = new Map();
let bookingCalendarMonthDate = new Date();
bookingCalendarMonthDate.setDate(1);

const feedback = document.createElement("p");
feedback.className = "booking-feedback";
form.appendChild(feedback);

function getFlashDesignInputs() {
  return document.querySelectorAll('input[name="flashDesign"]');
}

function toggleSectionFields(section, disabled) {
  section.querySelectorAll("input, select, textarea").forEach((field) => {
    field.disabled = disabled;
  });
}

function syncFlashRequired(isFlash) {
  getFlashDesignInputs().forEach((input) => {
    input.required = isFlash;
  });
}

function updateContactFields() {
  const selectedContactMethod = document.querySelector(
    'input[name="contactMethod"]:checked',
  )?.value;

  const useEmail = selectedContactMethod === "email";
  const useWhatsApp = selectedContactMethod === "whatsapp";

  emailField.classList.toggle("hidden", !useEmail);
  whatsappField.classList.toggle("hidden", !useWhatsApp);

  emailInput.disabled = !useEmail;
  whatsappInput.disabled = !useWhatsApp;

  emailInput.required = useEmail;
  whatsappInput.required = useWhatsApp;
}

function updateFlashSelectionDetails() {
  const selectedFlashInput = document.querySelector(
    'input[name="flashDesign"]:checked',
  );

  if (!selectedFlashInput) {
    flashSelectionTitle.textContent = "";
    flashSelectionDescription.textContent = "";
    flashSelectionPrice.textContent = "";
    flashSelectionDetails.classList.add("hidden");
    return;
  }

  const selectedFlash = window.findFlashById(selectedFlashInput.value);

  if (!selectedFlash) {
    return;
  }

  flashSelectionTitle.textContent = selectedFlash.title;
  flashSelectionDescription.textContent = selectedFlash.description;
  flashSelectionPrice.textContent = selectedFlash.price;
  flashSelectionDetails.classList.remove("hidden");
}

function updateForm() {
  const isFlash = type.value === "flash";
  const isCustom = type.value === "custom";

  flashFields.style.display = isFlash ? "block" : "none";
  customFields.style.display = isCustom ? "block" : "none";

  toggleSectionFields(flashFields, !isFlash);
  toggleSectionFields(customFields, !isCustom);
  syncFlashRequired(isFlash);

  if (isFlash) {
    updateFlashSelectionDetails();
  } else {
    flashSelectionDetails.classList.add("hidden");
  }
}

function normalizeSlots(slots) {
  const values = Array.isArray(slots) ? slots : [];
  const unique = [
    ...new Set(values.map((slot) => String(slot || "").trim())),
  ].filter(Boolean);
  unique.sort();
  return unique;
}

function formatDateLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateValue() {
  return getDateKey(new Date());
}

function renderBookingCalendar() {
  const year = bookingCalendarMonthDate.getFullYear();
  const monthIndex = bookingCalendarMonthDate.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const today = getTodayDateValue();
  const selectedDate = String(appointmentDateInput.value || "").trim();

  bookingCalendarLabel.textContent = firstDay.toLocaleDateString("es-ES", {
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
    const hasAvailability = availabilityMap.has(dateKey);
    const isToday = dateKey === today;
    const isPast = dateKey < today;
    const isSelected = selectedDate === dateKey;
    const isSelectable = hasAvailability && !isPast;

    cells.push(`
      <button
        type="button"
        class="calendar-cell day ${hasAvailability ? "available" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}"
        data-date="${dateKey}"
        ${isSelectable ? "" : "disabled"}
        aria-pressed="${isSelected ? "true" : "false"}"
      >
        ${day}
      </button>
    `);
  }

  bookingCalendarGrid.innerHTML = cells.join("");
}

function renderAvailabilityHelp() {
  if (!availabilityHelp) {
    return;
  }

  const sortedDates = [...availabilityMap.keys()].sort();

  if (!sortedDates.length) {
    availabilityHelp.textContent = "";
    return;
  }

  availabilityHelp.textContent = "";
}

function setAppointmentTimeOptions(dateValue) {
  const slots = availabilityMap.has(dateValue)
    ? normalizeSlots(availabilityMap.get(dateValue).slots)
    : [];

  appointmentTimeInput.innerHTML = "";

  if (!slots.length) {
    appointmentTimeInput.disabled = true;
    appointmentTimeInput.required = true;
    appointmentTimeInput.innerHTML =
      '<option value="">No hay horas configuradas para esta fecha</option>';
    appointmentTimeInput.value = "";
    return;
  }

  appointmentTimeInput.disabled = false;
  appointmentTimeInput.required = true;
  appointmentTimeInput.innerHTML =
    '<option value="">Selecciona una hora</option>' +
    slots.map((slot) => `<option value="${slot}">${slot}</option>`).join("");

  if (!slots.includes(appointmentTimeInput.value)) {
    appointmentTimeInput.value = "";
  }
}

function selectAppointmentDate(dateValue) {
  appointmentDateInput.value = dateValue;
  setAppointmentTimeOptions(dateValue);
  renderBookingCalendar();
}

function updateAppointmentDateValidation() {
  const selectedDate = String(appointmentDateInput.value || "").trim();

  if (!selectedDate) {
    appointmentDateInput.setCustomValidity("Selecciona una fecha disponible.");
    return;
  }

  if (!availabilityMap.has(selectedDate)) {
    appointmentDateInput.setCustomValidity(
      "Selecciona una fecha habilitada por Betty.",
    );
    return;
  }

  appointmentDateInput.setCustomValidity("");
}

function updateAppointmentTimeValidation() {
  const selectedDate = String(appointmentDateInput.value || "").trim();
  const selectedTime = String(appointmentTimeInput.value || "").trim();
  const slots = availabilityMap.has(selectedDate)
    ? normalizeSlots(availabilityMap.get(selectedDate).slots)
    : [];

  if (!selectedTime) {
    appointmentTimeInput.setCustomValidity("Selecciona una hora disponible.");
    return;
  }

  if (!slots.includes(selectedTime)) {
    appointmentTimeInput.setCustomValidity(
      "La hora seleccionada no esta disponible en esa fecha.",
    );
    return;
  }

  appointmentTimeInput.setCustomValidity("");
}

async function loadAvailability() {
  const response = await fetch("/api/availability");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo cargar la disponibilidad.");
  }

  const dates = Array.isArray(payload.data) ? payload.data : [];
  availabilityMap = new Map(
    dates.map((item) => [item.date, { slots: normalizeSlots(item.slots) }]),
  );

  const selectedDate = String(appointmentDateInput.value || "").trim();

  if (!selectedDate || !availabilityMap.has(selectedDate)) {
    appointmentDateInput.value = "";
    appointmentTimeInput.value = "";
    appointmentTimeInput.disabled = true;
    appointmentTimeInput.innerHTML =
      '<option value="">Primero selecciona una fecha</option>';
  } else {
    setAppointmentTimeOptions(selectedDate);
  }

  renderAvailabilityHelp();
  renderBookingCalendar();
  updateAppointmentDateValidation();
  updateAppointmentTimeValidation();
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `booking-feedback ${type || ""}`.trim();
}

function getAuthState() {
  const raw = localStorage.getItem("bettyAuth");

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || !parsed.token || !parsed.user) {
      return null;
    }

    return parsed;
  } catch (error) {
    localStorage.removeItem("bettyAuth");
    return null;
  }
}

async function uploadReferenceImage(token) {
  const file = referencesInput?.files?.[0];

  if (!file) {
    return null;
  }

  const uploadData = new FormData();
  uploadData.append("image", file);

  const uploadResponse = await fetch("/api/uploads/referencias-clientes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: uploadData,
    credentials: "include",
  });

  const uploadPayload = await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(
      uploadPayload.error || "No se pudo subir la imagen de referencia.",
    );
  }

  return uploadPayload?.data?.url || null;
}

type.addEventListener("change", updateForm);

contactMethodInputs.forEach((input) => {
  input.addEventListener("change", updateContactFields);
});

flashOptionsContainer.addEventListener("change", (event) => {
  if (event.target.matches('input[name="flashDesign"]')) {
    updateFlashSelectionDetails();
  }
});

bookingCalendarPrev.addEventListener("click", () => {
  bookingCalendarMonthDate = new Date(
    bookingCalendarMonthDate.getFullYear(),
    bookingCalendarMonthDate.getMonth() - 1,
    1,
  );
  renderBookingCalendar();
});

bookingCalendarNext.addEventListener("click", () => {
  bookingCalendarMonthDate = new Date(
    bookingCalendarMonthDate.getFullYear(),
    bookingCalendarMonthDate.getMonth() + 1,
    1,
  );
  renderBookingCalendar();
});

bookingCalendarGrid.addEventListener("click", (event) => {
  const date = event.target.dataset.date;

  if (!date || !availabilityMap.has(date)) {
    return;
  }

  selectAppointmentDate(date);
  updateAppointmentDateValidation();
  updateAppointmentTimeValidation();
  appointmentDateInput.reportValidity();
});

appointmentTimeInput.addEventListener("change", () => {
  updateAppointmentTimeValidation();
  appointmentTimeInput.reportValidity();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const auth = getAuthState();

  if (!auth) {
    setFeedback("Debes iniciar sesion para reservar.", "error");
    window.location.href = "/public/pages/login.html";
    return;
  }

  updateAppointmentDateValidation();
  updateAppointmentTimeValidation();

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const body = {
    appointmentDate: String(formData.get("appointmentDate") || "").trim(),
    appointmentTime: String(formData.get("appointmentTime") || "").trim(),
    type: String(formData.get("type") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    contactMethod: String(formData.get("contactMethod") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    whatsapp: String(formData.get("whatsapp") || "").trim(),
    flashDesign: String(formData.get("flashDesign") || "").trim(),
    idea: String(formData.get("idea") || "").trim(),
    placement: String(formData.get("placement") || "").trim(),
    size: String(formData.get("size") || "").trim(),
    color: String(formData.get("color") || "").trim(),
    style: String(formData.get("style") || "").trim(),
  };

  setFeedback("Enviando solicitud...", "success");

  try {
    const referenceImageUrl = await uploadReferenceImage(auth.token);

    if (referenceImageUrl) {
      body.referenceImageUrl = referenceImageUrl;
    }

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(body),
      credentials: "include",
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.error || "No se pudo enviar la solicitud de cita.",
      );
    }

    form.reset();
    type.value = "";
    appointmentDateInput.value = "";
    appointmentTimeInput.innerHTML =
      '<option value="">Primero selecciona una fecha</option>';
    appointmentTimeInput.disabled = true;
    updateForm();
    updateContactFields();
    renderBookingCalendar();
    setFeedback("Solicitud enviada. Betty te contactara pronto.", "success");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

async function initializeBookingForm() {
  if (typeof window.loadFlashCatalog === "function") {
    await window.loadFlashCatalog();
  }

  try {
    await loadAvailability();
  } catch (error) {
    availabilityMap = new Map();
    appointmentTimeInput.disabled = true;
    appointmentTimeInput.innerHTML =
      '<option value="">No se pudo cargar disponibilidad</option>';
    availabilityHelp.textContent =
      "No se pudo cargar la disponibilidad. Recarga la pagina.";
  }

  window.renderFlashOptions(flashOptionsContainer);

  const searchParams = new URLSearchParams(window.location.search);
  const preselectedType = searchParams.get("type");
  const preselectedFlash = searchParams.get("flash");

  if (preselectedType === "flash") {
    type.value = "flash";
  }

  if (preselectedFlash) {
    const flashInput = document.querySelector(
      `input[name="flashDesign"][value="${preselectedFlash}"]`,
    );

    if (flashInput) {
      flashInput.checked = true;
    }
  }

  updateForm();
  updateFlashSelectionDetails();
  updateContactFields();
}

initializeBookingForm();

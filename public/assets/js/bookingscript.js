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

type.addEventListener("change", updateForm);

contactMethodInputs.forEach((input) => {
  input.addEventListener("change", updateContactFields);
});

flashOptionsContainer.addEventListener("change", (event) => {
  if (event.target.matches('input[name="flashDesign"]')) {
    updateFlashSelectionDetails();
  }
});

async function initializeBookingForm() {
  if (typeof window.loadFlashCatalog === "function") {
    await window.loadFlashCatalog();
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const auth = getAuthState();

  if (!auth) {
    setFeedback("Debes iniciar sesion para reservar.", "error");
    window.location.href = "/public/pages/login.html";
    return;
  }

  const formData = new FormData(form);
  const body = {
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
    updateForm();
    updateContactFields();
    setFeedback("Solicitud enviada. Betty te contactara pronto.", "success");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

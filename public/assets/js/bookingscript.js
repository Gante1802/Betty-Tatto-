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

window.renderFlashOptions(flashOptionsContainer);

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
});

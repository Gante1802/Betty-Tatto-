const authRaw = localStorage.getItem("bettyAuth");
const auth = authRaw ? JSON.parse(authRaw) : null;

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

let editingFlashId = null;

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

async function refreshFlashes() {
  try {
    const flashes = await fetchFlashes();
    renderFlashes(flashes);

    return flashes;
  } catch (error) {
    setFeedback(error.message, "error");
    return [];
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

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("bettyAuth");
  document.cookie =
    "bettyAuthToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  window.location.href = "/public/pages/login.html";
});

resetFormState();
refreshFlashes();

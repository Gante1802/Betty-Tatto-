const type = document.getElementById("type");
const flashFields = document.getElementById("flashFields");
const customFields = document.getElementById("customFields");
const subbmit = document.getElementById("submit-btn");

function updateForm() {
  if (type.value === "flash") {
    flashFields.style.display = "block";
    customFields.style.display = "none";
  } else if (type.value === "custom") {
    flashFields.style.display = "none";
    customFields.style.display = "block";
  } else {
    flashFields.style.display = "none";
    customFields.style.display = "none";
  }
}

type.addEventListener("change", updateForm);
updateForm();

const defaultFlashCatalog = [
  {
    id: "1",
    title: "Flash 1",
    image: "/public/assets/images/designs/1.jpeg",
    description: "6 a 10 cm.",
    price: "$50",
  },
  {
    id: "2",
    title: "Flash 2",
    image: "/public/assets/images/designs/2.jpeg",
    description: "20cm",
    price: "$80",
  },
  {
    id: "3",
    title: "Flash 3",
    image: "/public/assets/images/designs/3.jpeg",
    description: "te parecen bien 47 cm?.",
    price: "$80",
  },
  {
    id: "4",
    title: "Flash 4",
    image: "/public/assets/images/designs/4.jpeg",
    description: "ENRIQUEEEEE.",
    price: "$80",
  },
  {
    id: "5",
    title: "Flash 5",
    image: "/public/assets/images/designs/5.jpeg",
    description: "eso mismo.",
    price: "$80",
  },
  {
    id: "6",
    title: "Flash 6",
    image: "/public/assets/images/designs/6.jpeg",
    description: "30cm.",
    price: "$80",
  },
  {
    id: "7",
    title: "Flash 7",
    image: "/public/assets/images/designs/7.jpeg",
    description:
      "Flash listo para reservar con una composicion directa y elegante.",
    price: "$80",
  },
];

window.flashCatalog = [...defaultFlashCatalog];

window.loadFlashCatalog = async function loadFlashCatalog() {
  try {
    const response = await fetch("/api/flashes");

    if (!response.ok) {
      return window.flashCatalog;
    }

    const payload = await response.json();

    if (Array.isArray(payload.data)) {
      window.flashCatalog = payload.data;
    }

    return window.flashCatalog;
  } catch (error) {
    return window.flashCatalog;
  }
};

window.findFlashById = function findFlashById(flashId) {
  return window.flashCatalog.find((flash) => flash.id === String(flashId));
};

window.renderFlashGrid = function renderFlashGrid(container) {
  if (!container) {
    return;
  }

  container.innerHTML = window.flashCatalog
    .map(
      (flash) => `
        <article class="flash-card">
          <div class="img-wrapper">
            <img src="${flash.image}" alt="${flash.title}" />
          </div>
          <div class="flash-info">
            <h3>${flash.title}</h3>
            <p>${flash.description}</p>
            <p class="flash-price">${flash.price}</p>
            <a class="btn btn-small" href="/public/pages/booking.html?type=flash&flash=${flash.id}">Quiero este</a>
          </div>
        </article>
      `,
    )
    .join("");
};

window.renderFlashOptions = function renderFlashOptions(container) {
  if (!container) {
    return;
  }

  container.innerHTML = window.flashCatalog
    .map(
      (flash) => `
        <label class="flash-option">
          <input type="radio" name="flashDesign" value="${flash.id}" />
          <img src="${flash.image}" alt="${flash.title}" />
          <span class="flash-option-title">${flash.title}</span>
          <span class="flash-option-description">${flash.description}</span>
          <span class="flash-option-price">${flash.price}</span>
        </label>
      `,
    )
    .join("");
};

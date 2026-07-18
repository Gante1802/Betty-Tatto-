const fs = require("fs/promises");
const path = require("path");

const flashesFilePath = path.join(__dirname, "../../data/flashes.json");

async function readFlashes() {
  try {
    const raw = await fs.readFile(flashesFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeFlashes(flashes) {
  await fs.writeFile(flashesFilePath, JSON.stringify(flashes, null, 2), "utf8");
}

function validateFlashPayload(payload) {
  const requiredFields = ["title", "image", "description", "price"];

  const missingField = requiredFields.find((field) => !payload[field]);

  if (missingField) {
    throw new Error(`El campo ${missingField} es obligatorio.`);
  }
}

async function listFlashes(req, res, next) {
  try {
    const flashes = await readFlashes();
    return res.status(200).json({ data: flashes });
  } catch (error) {
    return next(error);
  }
}

async function createFlash(req, res, next) {
  try {
    validateFlashPayload(req.body);

    const flashes = await readFlashes();
    const newFlash = {
      id: String(Date.now()),
      title: String(req.body.title).trim(),
      image: String(req.body.image).trim(),
      description: String(req.body.description).trim(),
      price: String(req.body.price).trim(),
    };

    flashes.push(newFlash);
    await writeFlashes(flashes);

    return res.status(201).json({ data: newFlash });
  } catch (error) {
    return next(error);
  }
}

async function updateFlash(req, res, next) {
  try {
    validateFlashPayload(req.body);

    const flashes = await readFlashes();
    const targetIndex = flashes.findIndex(
      (flash) => flash.id === req.params.id,
    );

    if (targetIndex === -1) {
      return res.status(404).json({ error: "Flash no encontrado." });
    }

    const updatedFlash = {
      id: flashes[targetIndex].id,
      title: String(req.body.title).trim(),
      image: String(req.body.image).trim(),
      description: String(req.body.description).trim(),
      price: String(req.body.price).trim(),
    };

    flashes[targetIndex] = updatedFlash;
    await writeFlashes(flashes);

    return res.status(200).json({ data: updatedFlash });
  } catch (error) {
    return next(error);
  }
}

async function deleteFlash(req, res, next) {
  try {
    const flashes = await readFlashes();
    const filteredFlashes = flashes.filter(
      (flash) => flash.id !== req.params.id,
    );

    if (filteredFlashes.length === flashes.length) {
      return res.status(404).json({ error: "Flash no encontrado." });
    }

    await writeFlashes(filteredFlashes);

    return res.status(200).json({ message: "Flash eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listFlashes,
  createFlash,
  updateFlash,
  deleteFlash,
};

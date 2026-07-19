const { ObjectId } = require("mongodb");
const { flashesCollection } = require("../database/collections");

function mapFlash(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    image: doc.image,
    description: doc.description,
    price: doc.price,
  };
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
    const flashes = await flashesCollection()
      .find({})
      .sort({ _id: -1 })
      .toArray();

    return res.status(200).json({ data: flashes.map(mapFlash) });
  } catch (error) {
    return next(error);
  }
}

async function createFlash(req, res, next) {
  try {
    validateFlashPayload(req.body);

    const newFlash = {
      title: String(req.body.title).trim(),
      image: String(req.body.image).trim(),
      description: String(req.body.description).trim(),
      price: String(req.body.price).trim(),
    };

    const result = await flashesCollection().insertOne(newFlash);
    newFlash._id = result.insertedId;

    return res.status(201).json({ data: mapFlash(newFlash) });
  } catch (error) {
    return next(error);
  }
}

async function updateFlash(req, res, next) {
  try {
    validateFlashPayload(req.body);

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: "Flash no encontrado." });
    }

    const flashId = new ObjectId(req.params.id);
    const updatedFlash = {
      title: String(req.body.title).trim(),
      image: String(req.body.image).trim(),
      description: String(req.body.description).trim(),
      price: String(req.body.price).trim(),
    };

    const updateResult = await flashesCollection().updateOne(
      { _id: flashId },
      { $set: updatedFlash },
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ error: "Flash no encontrado." });
    }

    const savedFlash = await flashesCollection().findOne({ _id: flashId });
    return res.status(200).json({ data: mapFlash(savedFlash) });
  } catch (error) {
    return next(error);
  }
}

async function deleteFlash(req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: "Flash no encontrado." });
    }

    const result = await flashesCollection().deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (!result.deletedCount) {
      return res.status(404).json({ error: "Flash no encontrado." });
    }

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

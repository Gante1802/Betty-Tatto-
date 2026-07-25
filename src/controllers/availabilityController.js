const { availableDatesCollection } = require("../database/collections");

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Horarios por defecto por cada dia disponible.
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

function normalizeDate(value) {
  return String(value || "").trim();
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

function normalizeTime(value) {
  return String(value || "").trim();
}

function normalizeSlots(slots) {
  if (!Array.isArray(slots)) {
    return null;
  }

  const cleanedSlots = [...new Set(slots.map(normalizeTime))].filter(Boolean);
  const allValid = cleanedSlots.every((slot) => TIME_PATTERN.test(slot));

  if (!allValid) {
    return null;
  }

  cleanedSlots.sort();
  return cleanedSlots;
}

function slotsForDay(slots) {
  const normalized = normalizeSlots(slots);

  if (!normalized || !normalized.length) {
    return [...DEFAULT_DAILY_SLOTS];
  }

  return normalized;
}

async function listAvailability(req, res, next) {
  try {
    const docs = await availableDatesCollection()
      .find({})
      .sort({ date: 1 })
      .toArray();

    return res.status(200).json({
      data: docs.map((doc) => ({
        id: String(doc._id),
        date: doc.date,
        slots: slotsForDay(doc.slots),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function addAvailability(req, res, next) {
  try {
    const date = normalizeDate(req.body.date);

    if (!isValidDateString(date)) {
      return res
        .status(400)
        .json({ error: "Fecha invalida. Usa el formato YYYY-MM-DD." });
    }

    await availableDatesCollection().updateOne(
      { date },
      {
        $setOnInsert: {
          date,
          slots: [...DEFAULT_DAILY_SLOTS],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    return res
      .status(201)
      .json({ message: "Fecha disponible guardada.", data: { date } });
  } catch (error) {
    return next(error);
  }
}

async function updateAvailabilitySlots(req, res, next) {
  try {
    const date = normalizeDate(req.params.date);
    const slots = normalizeSlots(req.body.slots);

    if (!isValidDateString(date)) {
      return res
        .status(400)
        .json({ error: "Fecha invalida. Usa el formato YYYY-MM-DD." });
    }

    if (!slots) {
      return res.status(400).json({
        error: "Slots invalidos. Usa horas en formato HH:mm.",
      });
    }

    const updateResult = await availableDatesCollection().updateOne(
      { date },
      {
        $set: {
          slots,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ error: "La fecha no existe." });
    }

    return res.status(200).json({
      message: "Horarios actualizados correctamente.",
      data: { date, slots },
    });
  } catch (error) {
    return next(error);
  }
}

async function removeAvailability(req, res, next) {
  try {
    const date = normalizeDate(req.params.date);

    if (!isValidDateString(date)) {
      return res
        .status(400)
        .json({ error: "Fecha invalida. Usa el formato YYYY-MM-DD." });
    }

    const result = await availableDatesCollection().deleteOne({ date });

    if (!result.deletedCount) {
      return res.status(404).json({ error: "La fecha no existe." });
    }

    return res.status(200).json({ message: "Fecha eliminada correctamente." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listAvailability,
  addAvailability,
  updateAvailabilitySlots,
  removeAvailability,
};

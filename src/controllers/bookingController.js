const { ObjectId } = require("mongodb");
const {
  bookingsCollection,
  availableDatesCollection,
} = require("../database/collections");

const ALLOWED_BOOKING_TYPES = new Set(["flash", "custom"]);
const ALLOWED_CONTACT_METHODS = new Set(["email", "whatsapp"]);
const ALLOWED_STATUSES = new Set([
  "pending",
  "contacted",
  "approved",
  "rejected",
]);
const OCCUPIED_STATUSES = ["pending", "contacted", "approved"];
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

function normalizeText(value) {
  return String(value || "").trim();
}

function validateBookingPayload(payload) {
  const type = normalizeText(payload.type);
  const name = normalizeText(payload.name);
  const contactMethod = normalizeText(payload.contactMethod);
  const appointmentDate = normalizeText(payload.appointmentDate);
  const appointmentTime = normalizeText(payload.appointmentTime);

  if (!ALLOWED_BOOKING_TYPES.has(type)) {
    throw new Error("Tipo de cita invalido.");
  }

  if (!name) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!ALLOWED_CONTACT_METHODS.has(contactMethod)) {
    throw new Error("Metodo de contacto invalido.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    throw new Error("Debes seleccionar una fecha valida para la cita.");
  }

  if (!TIME_PATTERN.test(appointmentTime)) {
    throw new Error("Debes seleccionar una hora valida para la cita.");
  }

  if (contactMethod === "email" && !normalizeText(payload.email)) {
    throw new Error("El correo es obligatorio para ese metodo de contacto.");
  }

  if (contactMethod === "whatsapp" && !normalizeText(payload.whatsapp)) {
    throw new Error("El WhatsApp es obligatorio para ese metodo de contacto.");
  }

  if (type === "flash" && !normalizeText(payload.flashDesign)) {
    throw new Error("Debes seleccionar un flash.");
  }

  if (type === "custom") {
    if (!normalizeText(payload.idea)) {
      throw new Error("Debes describir tu idea para tatuaje personalizado.");
    }

    if (!normalizeText(payload.placement)) {
      throw new Error("Debes indicar la ubicacion en el cuerpo.");
    }
  }
}

function mapBooking(doc) {
  return {
    id: String(doc._id),
    userId: doc.userId,
    username: doc.username,
    userDisplayName: doc.userDisplayName,
    appointmentDate: doc.appointmentDate || null,
    appointmentTime: doc.appointmentTime || null,
    type: doc.type,
    status: doc.status,
    name: doc.name,
    contactMethod: doc.contactMethod,
    email: doc.email || null,
    whatsapp: doc.whatsapp || null,
    flashDesign: doc.flashDesign || null,
    idea: doc.idea || null,
    placement: doc.placement || null,
    size: doc.size || null,
    color: doc.color || null,
    style: doc.style || null,
    referenceImageUrl: doc.referenceImageUrl || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function normalizeSlots(slots) {
  const values = Array.isArray(slots) ? slots : [];
  const cleaned = [
    ...new Set(values.map((slot) => normalizeText(slot))),
  ].filter((slot) => TIME_PATTERN.test(slot));

  cleaned.sort();
  return cleaned;
}

function slotsForDay(slots) {
  const normalized = normalizeSlots(slots);
  return normalized.length ? normalized : [...DEFAULT_DAILY_SLOTS];
}

async function createBooking(req, res, next) {
  try {
    validateBookingPayload(req.body);
    const appointmentDate = normalizeText(req.body.appointmentDate);
    const appointmentTime = normalizeText(req.body.appointmentTime);

    const availability = await availableDatesCollection().findOne({
      date: appointmentDate,
    });

    if (!availability) {
      return res.status(400).json({
        error:
          "La fecha seleccionada no esta disponible. Elige una fecha habilitada por Betty.",
      });
    }

    const availableSlots = slotsForDay(availability.slots);

    if (!availableSlots.includes(appointmentTime)) {
      return res.status(400).json({
        error: "La hora seleccionada no esta disponible para la fecha elegida.",
      });
    }

    const hasOverlap = await bookingsCollection().findOne({
      appointmentDate,
      appointmentTime,
      status: { $in: OCCUPIED_STATUSES },
    });

    if (hasOverlap) {
      return res.status(409).json({
        error: "Ese horario ya fue reservado. Elige otra hora disponible.",
      });
    }

    const now = new Date().toISOString();
    const bookingDoc = {
      userId: req.user.id,
      username: req.user.username,
      userDisplayName: req.user.displayName,
      appointmentDate,
      appointmentTime,
      type: normalizeText(req.body.type),
      status: "pending",
      name: normalizeText(req.body.name),
      contactMethod: normalizeText(req.body.contactMethod),
      email: normalizeText(req.body.email) || null,
      whatsapp: normalizeText(req.body.whatsapp) || null,
      flashDesign: normalizeText(req.body.flashDesign) || null,
      idea: normalizeText(req.body.idea) || null,
      placement: normalizeText(req.body.placement) || null,
      size: normalizeText(req.body.size) || null,
      color: normalizeText(req.body.color) || null,
      style: normalizeText(req.body.style) || null,
      referenceImageUrl: normalizeText(req.body.referenceImageUrl) || null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await bookingsCollection().insertOne(bookingDoc);
    bookingDoc._id = result.insertedId;

    return res.status(201).json({
      message: "Solicitud de cita creada correctamente.",
      data: mapBooking(bookingDoc),
    });
  } catch (error) {
    return next(error);
  }
}

async function listMyBookings(req, res, next) {
  try {
    const docs = await bookingsCollection()
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ data: docs.map(mapBooking) });
  } catch (error) {
    return next(error);
  }
}

async function listBookings(req, res, next) {
  try {
    const query = {};
    const status = normalizeText(req.query.status);

    if (status) {
      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ error: "Estado de cita invalido." });
      }

      query.status = status;
    }

    const docs = await bookingsCollection()
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ data: docs.map(mapBooking) });
  } catch (error) {
    return next(error);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const status = normalizeText(req.body.status);

    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: "Estado de cita invalido." });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }

    const bookingId = new ObjectId(req.params.id);

    const updateResult = await bookingsCollection().updateOne(
      { _id: bookingId },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }

    const updatedBooking = await bookingsCollection().findOne({
      _id: bookingId,
    });

    return res.status(200).json({
      message: "Estado de solicitud actualizado.",
      data: mapBooking(updatedBooking),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBooking,
  listMyBookings,
  listBookings,
  updateBookingStatus,
};

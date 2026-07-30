const nodemailer = require("nodemailer");

let cachedTransporter;

function buildTransportConfig() {
  const host = String(process.env.SMTP_HOST || "").trim();

  if (!host) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();

  const config = {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
  };

  if (user && pass) {
    config.auth = {
      user,
      pass,
    };
  }

  return config;
}

function getTransporter() {
  if (cachedTransporter !== undefined) {
    return cachedTransporter;
  }

  const config = buildTransportConfig();

  if (!config) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport(config);
  return cachedTransporter;
}

function formatStatusLabel(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  if (normalized === "approved") {
    return "aprobada";
  }

  if (normalized === "rejected") {
    return "rechazada";
  }

  if (normalized === "contacted") {
    return "contactada";
  }

  return "actualizada";
}

function buildSubject(booking) {
  return `Tu solicitud de cita fue ${formatStatusLabel(booking.status)} | Betty Tattoo`;
}

function buildTextBody(booking) {
  const lines = [
    `Hola ${booking.userDisplayName || booking.name || ""},`,
    "",
    `Tu solicitud para el ${booking.appointmentDate || "fecha sin definir"} a las ${booking.appointmentTime || "hora sin definir"} fue ${formatStatusLabel(booking.status)}.`,
    "",
  ];

  if (booking.adminComment) {
    lines.push("Mensaje del admin:");
    lines.push(String(booking.adminComment));
    lines.push("");
  }

  if (booking.adminQuotedPrice) {
    lines.push(`Precio estimado: ${booking.adminQuotedPrice}`);
    lines.push("");
  }

  lines.push("Gracias por reservar con Betty Tattoo.");
  return lines.join("\n");
}

async function notifyBookingStatusUpdate(booking) {
  const hasEmailChannel = booking.contactMethod === "email" && booking.email;

  if (!hasEmailChannel) {
    return {
      sent: false,
      channel: "none",
      reason: "contact-method-not-email",
    };
  }

  const transporter = getTransporter();

  if (!transporter) {
    return {
      sent: false,
      channel: "email",
      reason: "smtp-not-configured",
    };
  }

  const fromAddress = String(
    process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "no-reply@bettytattoo.local",
  ).trim();

  try {
    const result = await transporter.sendMail({
      from: fromAddress,
      to: booking.email,
      subject: buildSubject(booking),
      text: buildTextBody(booking),
    });

    return {
      sent: true,
      channel: "email",
      messageId: result.messageId,
    };
  } catch (error) {
    return {
      sent: false,
      channel: "email",
      reason: error.message,
    };
  }
}

module.exports = {
  notifyBookingStatusUpdate,
};

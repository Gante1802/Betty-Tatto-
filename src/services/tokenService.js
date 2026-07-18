const crypto = require("crypto");

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || "betty-tatto-dev-secret";

function createToken(payload) {
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) {
    throw new Error("Token invalido.");
  }

  const [payloadBase64, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  if (signature !== expectedSignature) {
    throw new Error("Token invalido.");
  }

  const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf8");
  return JSON.parse(payloadJson);
}

module.exports = {
  createToken,
  verifyToken,
};

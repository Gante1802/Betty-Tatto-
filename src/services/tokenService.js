const jwt = require("jsonwebtoken");

const TOKEN_SECRET =
  process.env.AUTH_TOKEN_SECRET || "betty-tatto-dev-secret-change-this";
const TOKEN_TTL = process.env.AUTH_TOKEN_TTL || "24h";

function createToken(payload) {
  return jwt.sign(payload, TOKEN_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

function verifyToken(token) {
  return jwt.verify(token, TOKEN_SECRET);
}

module.exports = {
  createToken,
  verifyToken,
};
